import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { Response } from '#/server/api/search_music';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import { getDB } from '@/db';
import { getSingerListInMusicIds } from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import {
  Music,
  MusicProperty,
  MUSIC_TABLE_NAME,
  SingerProperty,
  Singer,
} from '@/constants/db_definition';
import { getAssetPublicPath } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalMusic = Pick<
  Music,
  | MusicProperty.ID
  | MusicProperty.TYPE
  | MusicProperty.NAME
  | MusicProperty.ALIASES
  | MusicProperty.CREATE_USER_ID
  | MusicProperty.COVER
  | MusicProperty.ASSET
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
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  let musicList: LocalMusic[] = [];
  let total: number = 0;
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const musicPatternSQL = `
      SELECT ${MusicProperty.ID} FROM ${MUSIC_TABLE_NAME} 
        WHERE ${MusicProperty.NAME} LIKE ? 
          OR ${MusicProperty.ALIASES} LIKE ?
    `;
    const singerPatternSQL = `
      SELECT msr.musicId FROM music_singer_relation AS msr
        LEFT JOIN singer AS s ON msr.singerId = s.id 
        WHERE
          s.name LIKE ?
          OR s.aliases LIKE ?
    `;
    const results = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT count(*) as value FROM music 
            WHERE id IN (${musicPatternSQL}) OR id IN (${singerPatternSQL})
        `,
        [pattern, pattern, pattern, pattern],
      ),
      await getDB().all<LocalMusic>(
        `
          SELECT
            id,
            type,
            name,
            aliases,
            cover,
            asset
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
      return ctx.except(ExceptionCode.WRONG_PARAMETER);
    }

    const results = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT count(*) as value FROM music
        `,
        [],
      ),
      getDB().all<LocalMusic>(
        `
          SELECT
            id,
            type,
            name,
            aliases,
            cover,
            asset
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

  return ctx.success<Response>({
    total,
    musicList: musicList.map((m) => ({
      ...excludeProperty(m, [MusicProperty.CREATE_USER_ID]),
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      asset: getAssetPublicPath(m.asset, AssetType.MUSIC),
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingerList[m.id] || [],
    })),
  });
};
