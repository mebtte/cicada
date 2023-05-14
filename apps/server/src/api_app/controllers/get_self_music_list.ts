import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import excludeProperty from '#/utils/exclude_property';
import {
  Music,
  MusicProperty,
  MUSIC_TABLE_NAME,
  Singer,
  SingerProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getSingerListInMusicIds } from '@/db/singer';
import { getAssetPublicPath } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;
type LocalMusic = Pick<
  Music,
  | MusicProperty.ID
  | MusicProperty.TYPE
  | MusicProperty.NAME
  | MusicProperty.ALIASES
  | MusicProperty.HEAT
  | MusicProperty.CREATE_TIMESTAMP
  | MusicProperty.ASSET
  | MusicProperty.COVER
>;

export default async (ctx: Context) => {
  const { keyword, page, pageSize } = ctx.query;
  const pageNumber = page ? Number(page) : undefined;
  const pageSizeNumber = pageSize ? Number(pageSize) : undefined;

  if (
    typeof keyword !== 'string' ||
    keyword.length > SEARCH_KEYWORD_MAX_LENGTH ||
    !pageNumber ||
    pageNumber < 1 ||
    !pageSizeNumber ||
    pageSizeNumber < 1 ||
    pageSizeNumber > MAX_PAGE_SIZE
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  let total: number;
  let musicList: LocalMusic[];
  if (keyword.length) {
    const pattern = `%${keyword}%`;
    const musicPatternSQL = `
      SELECT
        ${MusicProperty.ID}
      FROM ${MUSIC_TABLE_NAME}
      WHERE ${MusicProperty.CREATE_USER_ID} = ?
        AND ( ${MusicProperty.NAME} LIKE ? OR ${MusicProperty.ALIASES} LIKE ? )
    `;
    const singerPatternSQL = `
      SELECT
        msr.musicId
      FROM music_singer_relation AS msr
      LEFT JOIN singer as s ON msr.singerId = s.id
      LEFT JOIN music as m ON msr.musicId = m.id
      WHERE (m.createUserId = ?)
        AND (s.name LIKE ? OR s.aliases LIKE ?)
    `;
    const [totalObject, localMusicList] = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT count(*) as value FROM music
            WHERE id IN (${musicPatternSQL}) OR id IN (${singerPatternSQL})
        `,
        [ctx.user.id, pattern, pattern, ctx.user.id, pattern, pattern],
      ),
      getDB().all<LocalMusic>(
        `
          SELECT
            ${MusicProperty.ID},
            ${MusicProperty.COVER},
            ${MusicProperty.TYPE},
            ${MusicProperty.NAME},
            ${MusicProperty.ALIASES},
            ${MusicProperty.HEAT},
            ${MusicProperty.CREATE_TIMESTAMP},
            ${MusicProperty.ASSET},
            ${MusicProperty.COVER}
          FROM ${MUSIC_TABLE_NAME}
            WHERE ${MusicProperty.ID} IN (${musicPatternSQL}) OR ${MusicProperty.ID} IN (${singerPatternSQL})
          ORDER BY ${MusicProperty.CREATE_TIMESTAMP} DESC
          LIMIT ?
          OFFSET ?
        `,
        [
          ctx.user.id,
          pattern,
          pattern,
          ctx.user.id,
          pattern,
          pattern,
          pageSizeNumber,
          (pageNumber - 1) * pageSizeNumber,
        ],
      ),
    ]);

    total = totalObject!.value;
    musicList = localMusicList;
  } else {
    const [totalObject, localMusicList] = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT count(*) AS value FROM music
          WHERE createUserId = ?
        `,
        [ctx.user.id],
      ),
      getDB().all<LocalMusic>(
        `
          SELECT
            ${MusicProperty.ID},
            ${MusicProperty.COVER},
            ${MusicProperty.TYPE},
            ${MusicProperty.NAME},
            ${MusicProperty.ALIASES},
            ${MusicProperty.HEAT},
            ${MusicProperty.CREATE_TIMESTAMP},
            ${MusicProperty.ASSET},
            ${MusicProperty.COVER}
          FROM ${MUSIC_TABLE_NAME}
          WHERE ${MusicProperty.CREATE_USER_ID} = ?
          ORDER BY ${MusicProperty.CREATE_TIMESTAMP} DESC
          LIMIT ?
          OFFSET ?
        `,
        [ctx.user.id, pageSizeNumber, (pageNumber - 1) * pageSizeNumber],
      ),
    ]);
    total = totalObject!.value;
    musicList = localMusicList;
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
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingerList[m.id] || [],
      asset: getAssetPublicPath(m.asset, AssetType.MUSIC),
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
    })),
  });
};
