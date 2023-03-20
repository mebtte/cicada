import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import excludeProperty from '#/utils/exclude_property';
import { getDB } from '@/db';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  getSingerListInMusicIds,
  Singer,
  Property as SingerProperty,
} from '@/db/singer';
import { getAssetPublicPath } from '@/platform/asset';
import { Context } from '../constants';

const MAX_PAGE_SIZE = 100;

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
  let musicPlayRecordList: LocalMusic[];
  if (keyword.length) {
  } else {
    const [] = Promise.all([
      getDB().all(
        `
        SELECT
          mpr.id as recordId,
          mpr.percent,
          mpr.timestamp,
          
          m.id,
          m.cover,
          m.type,
          m.name,
          m.aliases,
          m.sq,
          m.hq,
          m.ac
        FROM music_play_record AS mpr
        LEFT JOIN music AS m
          ON mpr.musicId = m.id
        WHERE mpr.userId = '333333'
        ORDER BY mpr.timestamp DESC
        LIMIT 50
      `,
        [],
      ),
    ]);
  }

  if (!musicPlayRecordList.length) {
    return ctx.success({
      total,
      musicPlayRecordList: [],
    });
  }

  const singerList = await getSingerListInMusicIds(
    musicPlayRecordList.map((m) => m.id),
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
    musicPlayRecordList: musicPlayRecordList.map((m) => ({
      ...m,
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetPublicPath(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetPublicPath(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetPublicPath(m.ac, AssetType.MUSIC_AC),
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingerList[m.id] || [],
    })),
  });
};
