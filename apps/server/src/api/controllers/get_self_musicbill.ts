import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import {
  getMusicbillById,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  getSingerListInMusicIds,
  Property as CharacterProperty,
} from '@/db/character';
import excludeProperty from '#/utils/exclude_property';
import { getAssetUrl } from '@/platform/asset';
import * as db from '@/db';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };

  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [
    MusicbillProperty.ID,
    MusicbillProperty.USER_ID,
    MusicbillProperty.COVER,
    MusicbillProperty.NAME,
    MusicbillProperty.PUBLIC,
    MusicbillProperty.CREATE_TIMESTAMP,
  ]);

  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const musicList = await db.all<
    Pick<
      Music,
      | MusicProperty.ID
      | MusicProperty.TYPE
      | MusicProperty.NAME
      | MusicProperty.ALIASES
      | MusicProperty.COVER
      | MusicProperty.SQ
      | MusicProperty.HQ
      | MusicProperty.AC
    >
  >(
    `
      SELECT
        m.id,
        m.type,
        m.name,
        m.aliases,
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

  const allSingerList = await getSingerListInMusicIds(
    musicList.map((m) => m.id),
    [
      CharacterProperty.ID,
      CharacterProperty.AVATAR,
      CharacterProperty.NAME,
      CharacterProperty.ALIASES,
    ],
  );
  const musicIdMapSingers: {
    [key: string]: {
      id: string;
      name: string;
      aliases: string;
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
    ...excludeProperty(musicbill, [MusicbillProperty.USER_ID]),
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
