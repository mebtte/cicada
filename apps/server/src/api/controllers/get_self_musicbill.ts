import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById, Property } from '@/db/musicbill';
import excludeProperty from '#/utils/exclude_property';
import { AssetType, getAssetUrl } from '@/platform/asset';
import * as db from '@/db';
import { Context } from '../constants/koa';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };

  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [
    Property.ID,
    Property.USER_ID,
    Property.COVER,
    Property.NAME,
    Property.PUBLIC,
    Property.CREATE_TIMESTAMP,
  ]);

  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const musicList = await db.all<{
    id: string;
    type: 1 | 2;
    name: string;
    alias: string;
    cover: string;
    sq: string;
    hq: string;
    ac: string;
  }>(
    `
      SELECT
        m.id,
        m.type,
        m.name,
        m.alias,
        m.cover,
        m.sq,
        m.hq,
        m.ac
      FROM
        musicbill_music AS mm
        LEFT JOIN music AS m ON mm.musicId = m.id 
      WHERE
        mm.musicbillId = ? 
      ORDER BY
        mm.addTimestamp DESC;
    `,
    [id],
  );

  const allSingerList = await db.all<{
    musicId: string;
    id: string;
    name: string;
    alias: string;
    avatar: string;
  }>(
    `
      SELECT
        c.id,
        c.name,
        c.alias,
        c.avatar,
        msr.musicId
      FROM
        music_singer_relation AS msr
        LEFT JOIN character AS c ON msr.singerId = c.id 
      WHERE
        msr.musicId IN ( ${musicList.map(() => '?').join(',')} );
    `,
    musicList.map((m) => m.id),
  );
  const musicIdMapSingers: {
    [key: string]: {
      id: string;
      name: string;
      alias: string;
      avatar: string;
    }[];
  } = {};
  for (const singer of allSingerList) {
    if (!musicIdMapSingers[singer.musicId]) {
      musicIdMapSingers[singer.musicId] = [];
    }
    musicIdMapSingers[singer.musicId].push({
      ...excludeProperty(singer, ['musicId']),
      avatar: getAssetUrl(singer.avatar, AssetType.CHARACTER_AVATAR),
    });
  }

  return ctx.success({
    ...excludeProperty(musicbill, [Property.USER_ID]),
    cover: getAssetUrl(musicbill.cover, AssetType.MUSICBILL_COVER),
    musicList: musicList.map((m) => ({
      ...m,
      cover: getAssetUrl(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetUrl(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetUrl(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetUrl(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSingers[m.id] || [],
    })),
  });
};
