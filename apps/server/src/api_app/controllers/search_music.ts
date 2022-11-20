import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import db from '@/db';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  Singer,
  getSingerListInMusicIds,
  Property as SingerProperty,
} from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalMusic = Pick<
  Music,
  | MusicProperty.ID
  | MusicProperty.TYPE
  | MusicProperty.NAME
  | MusicProperty.ALIASES
  | MusicProperty.COVER
  | MusicProperty.SQ
  | MusicProperty.HQ
  | MusicProperty.AC
  | MusicProperty.CREATE_USER_ID
>;

export default async (ctx: Context) => {
  const { keyword, page, pageSize } = ctx.request.query;
  const pageNumber = page ? Number(page) : undefined;
  const pageSizeNumber = pageSize ? Number(pageSize) : undefined;
  if (
    typeof keyword !== 'string' ||
    keyword.includes(ALIAS_DIVIDER) ||
    keyword.length > SEARCH_KEYWORD_MAX_LENGTH ||
    !pageNumber ||
    pageNumber < 0 ||
    !pageSizeNumber ||
    pageSizeNumber < 0 ||
    pageSizeNumber > MAX_PAGE_SIZE
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  let musicList: LocalMusic[] = [];
  let total: number = 0;
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const musicPatternSQL = `
      SELECT id FROM  music 
        WHERE name LIKE ? 
          OR aliases LIKE ?
    `;
    const singerPatternSQL = `
      SELECT msr.musicId FROM music_singer_relation AS msr
        LEFT JOIN singer AS s ON msr.singerId = s.id 
        WHERE
          s.name LIKE ?
          OR s.aliases LIKE ?
    `;
    const results = await Promise.all([
      db.get<{ value: number }>(
        `
          SELECT count(*) as value FROM music 
            WHERE id IN (${musicPatternSQL}) OR id IN (${singerPatternSQL})
        `,
        [pattern, pattern, pattern, pattern],
      ),
      await db.all<LocalMusic>(
        `
          SELECT
            id,
            type,
            name,
            aliases,
            cover,
            sq,
            hq,
            ac
          FROM music
            WHERE id IN ( ${musicPatternSQL} ) OR id IN ( ${singerPatternSQL} )
            ORDER BY heat DESC
            LIMIT ? OFFSET ?
        `,
        [
          pattern,
          pattern,
          pattern,
          pattern,
          pageSizeNumber,
          pageSizeNumber * (pageNumber - 1),
        ],
      ),
    ]);

    total = results[0]!.value;
    [, musicList] = results;
  } else {
    if (pageNumber !== 1) {
      return ctx.except(ExceptionCode.PARAMETER_ERROR);
    }

    const results = await Promise.all([
      db.get<{ value: number }>(
        `
          SELECT count(*) as value FROM music
        `,
        [],
      ),
      db.all<LocalMusic>(
        `
          SELECT
            id,
            type,
            name,
            aliases,
            cover,
            sq,
            hq,
            ac
          FROM music
          ORDER BY random()
          LIMIT ?
        `,
        [pageSizeNumber],
      ),
    ]);

    total = Math.min(results[0]!.value, pageSizeNumber);
    [, musicList] = results;
  }

  if (!musicList.length) {
    return ctx.success({
      total,
      musicList: [],
    });
  }

  const singerList = await getSingerListInMusicIds(
    musicList.map((m) => m.id),
    [SingerProperty.ID, SingerProperty.NAME, SingerProperty.ALIASES],
  );
  const musicIdMapSingerList: {
    [key: string]: (Pick<Singer, SingerProperty.ID | SingerProperty.NAME> & {
      aliases: string[];
    })[];
  } = {};
  singerList.forEach((s) => {
    if (!musicIdMapSingerList[s.musicId]) {
      musicIdMapSingerList[s.musicId] = [];
    }
    musicIdMapSingerList[s.musicId].push({
      ...excludeProperty(s, ['musicId']),
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
    });
  });

  return ctx.success({
    total,
    musicList: musicList.map((m) => ({
      ...excludeProperty(m, [MusicProperty.CREATE_USER_ID]),
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      cover: getAssetUrl(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetUrl(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetUrl(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetUrl(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSingerList[m.id] || [],
    })),
  });
};
