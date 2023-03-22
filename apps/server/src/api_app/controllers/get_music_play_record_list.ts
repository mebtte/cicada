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
type LocalMusic = Pick<
  Music,
  | MusicProperty.ID
  | MusicProperty.COVER
  | MusicProperty.TYPE
  | MusicProperty.NAME
  | MusicProperty.ALIASES
  | MusicProperty.SQ
  | MusicProperty.HQ
  | MusicProperty.AC
>;
type LocalMusicPlayRecord = LocalMusic & {
  recordId: number;
  percent: number;
  timestamp: number;
};

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
  let musicPlayRecordList: LocalMusicPlayRecord[];
  if (keyword.length) {
    total = 0;
    musicPlayRecordList = [];
  } else {
    const [totolObject, localMusicPlayRecord] = await Promise.all([
      getDB().get<{ value: number }>(
        `
          SELECT
            count(*) AS value
          FROM music_play_record
          WHERE userId = ?
        `,
        [ctx.user.id],
      ),
      getDB().all<LocalMusicPlayRecord>(
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
          WHERE mpr.userId = ?
          ORDER BY mpr.timestamp DESC
          LIMIT ?
          OFFSET ?
        `,
        [ctx.user.id, pageSizeNumber, (pageNumber - 1) * pageSizeNumber],
      ),
    ]);
    total = totolObject!.value;
    musicPlayRecordList = localMusicPlayRecord;
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
