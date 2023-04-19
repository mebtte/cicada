import { ALIAS_DIVIDER } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import excludeProperty from '#/utils/exclude_property';
import { Music, MusicProperty } from '@/constants/db_definition';
import { getDB } from '@/db';
import { Lyric, Property as LyricProperty } from '@/db/lyric';
import {
  getSingerListInMusicIds,
  Property as SingerProperty,
  Singer,
} from '@/db/singer';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 50;

export default async (ctx: Context) => {
  const { keyword, page, pageSize } = ctx.query as {
    keyword: unknown;
    page: unknown;
    pageSize: unknown;
  };
  const pageNumber = page ? Number(page) : undefined;
  const pageSizeNumber = pageSize ? Number(pageSize) : undefined;
  if (
    typeof keyword !== 'string' ||
    !keyword.length ||
    keyword.length > SEARCH_KEYWORD_MAX_LENGTH ||
    !pageNumber ||
    pageNumber < 0 ||
    !pageSizeNumber ||
    pageSizeNumber < 0 ||
    pageSizeNumber > MAX_PAGE_SIZE
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const pattern = `%${keyword}%`;
  const [totalObject, musicList] = await Promise.all([
    getDB().get<{ value: number }>(
      `
        SELECT count(distinct musicId) AS value FROM lyric
        WHERE lrcContent LIKE ?
      `,
      [pattern],
    ),
    getDB().all<
      Pick<
        Music,
        | MusicProperty.ID
        | MusicProperty.NAME
        | MusicProperty.TYPE
        | MusicProperty.ALIASES
        | MusicProperty.COVER
      >
    >(
      `
        SELECT
          DISTINCT m.${MusicProperty.ID},
          m.${MusicProperty.NAME},
          m.${MusicProperty.TYPE},
          m.${MusicProperty.ALIASES},
          m.${MusicProperty.COVER}
        FROM lyric AS l
        LEFT JOIN music AS m
          ON l.musicId = m.id
        WHERE l.lrcContent like ?
        ORDER BY m.heat DESC
        LIMIT ?
        OFFSET ?
      `,
      [pattern, pageSizeNumber, pageSizeNumber * (pageNumber - 1)],
    ),
  ]);

  if (!musicList.length) {
    return ctx.success({
      total: totalObject!.value,
      musicList: [],
    });
  }

  const [lyricList, singerList] = await Promise.all([
    getDB().all<
      Pick<Lyric, LyricProperty.ID | LyricProperty.LRC | LyricProperty.MUSIC_ID>
    >(
      `
        SELECT
          id,
          lrc,
          musicId
        FROM lyric
        WHERE musicId IN ( ${musicList.map(() => '?').join(', ')} )
      `,
      musicList.map((m) => m.id),
    ),
    getSingerListInMusicIds(
      musicList.map((m) => m.id),
      [SingerProperty.ID, SingerProperty.NAME, SingerProperty.ALIASES],
    ),
  ]);

  const musicIdMapLyricList: {
    [key: string]: Pick<Lyric, LyricProperty.ID | LyricProperty.LRC>[];
  } = {};
  lyricList.forEach((lyric) => {
    if (!musicIdMapLyricList[lyric.musicId]) {
      musicIdMapLyricList[lyric.musicId] = [];
    }
    musicIdMapLyricList[lyric.musicId].push(
      excludeProperty(lyric, [LyricProperty.MUSIC_ID]),
    );
  });

  const musicIdMapSingerList: {
    [key: string]: (Pick<Singer, SingerProperty.ID | SingerProperty.NAME> & {
      aliases: string[];
    })[];
  } = {};
  singerList.forEach((singer) => {
    if (!musicIdMapSingerList[singer.musicId]) {
      musicIdMapSingerList[singer.musicId] = [];
    }
    musicIdMapSingerList[singer.musicId].push({
      ...excludeProperty(singer, ['musicId']),
      aliases: singer.aliases ? singer.aliases.split(ALIAS_DIVIDER) : [],
    });
  });

  return ctx.success({
    total: totalObject!.value,
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingerList[m.id] || [],
      lyrics: musicIdMapLyricList[m.id] || [],
    })),
  });
};
