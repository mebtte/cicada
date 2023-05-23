import SearchMusicByLyric from '#/response_data/api/search_music_by_lyric';
import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import excludeProperty from '#/utils/exclude_property';
import {
  LYRIC_TABLE_NAME,
  Lyric,
  LyricProperty,
  MUSIC_TABLE_NAME,
  Music,
  MusicProperty,
  Singer,
  SingerProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getSingerListInMusicIds } from '@/db/singer';
import { getAssetPublicPath } from '@/platform/asset';
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
        SELECT
          count(DISTINCT ${LyricProperty.MUSIC_ID}) AS value
        FROM ${LYRIC_TABLE_NAME}
        WHERE ${LyricProperty.LRC_CONTENT} LIKE ?
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
        | MusicProperty.ASSET
      >
    >(
      `
        SELECT
          DISTINCT m.${MusicProperty.ID},
          m.${MusicProperty.NAME},
          m.${MusicProperty.TYPE},
          m.${MusicProperty.ALIASES},
          m.${MusicProperty.COVER},
          m.${MusicProperty.ASSET}
        FROM ${LYRIC_TABLE_NAME} AS l
        LEFT JOIN ${MUSIC_TABLE_NAME} AS m
          ON l.${LyricProperty.MUSIC_ID} = m.${MusicProperty.ID}
        WHERE l.${LyricProperty.LRC_CONTENT} like ?
        ORDER BY m.${MusicProperty.HEAT} DESC
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
          ${LyricProperty.ID},
          ${LyricProperty.LRC},
          ${LyricProperty.MUSIC_ID}
        FROM ${LYRIC_TABLE_NAME}
        WHERE ${LyricProperty.MUSIC_ID} IN ( ${musicList
        .map(() => '?')
        .join(', ')} )
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

  return ctx.success<SearchMusicByLyric>({
    total: totalObject!.value,
    musicList: musicList.map((m) => ({
      ...m,
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      asset: getAssetPublicPath(m.asset, AssetType.MUSIC),
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingerList[m.id] || [],
      lyrics: musicIdMapLyricList[m.id] || [],
    })),
  });
};
