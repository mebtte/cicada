import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { getUserById, Property as UserProperty } from '@/db/user';
import { getAssetUrl } from '@/platform/asset';
import db from '@/db';
import { Music, Property as MusicProperty } from '@/db/music';
import { Musicbill, Property as MusicbillProperty } from '@/db/musicbill';
import {
  getSingerListInMusicIds,
  Property as SingerProperty,
} from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserById(id, [
    UserProperty.ID,
    UserProperty.AVATAR,
    UserProperty.JOIN_TIMESTAMP,
    UserProperty.NICKNAME,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }

  const [musicbillList, musicList] = await Promise.all([
    db.all<
      Pick<
        Musicbill,
        MusicbillProperty.ID | MusicbillProperty.COVER | MusicbillProperty.NAME
      >
    >(
      `
        SELECT
          ${[
            MusicbillProperty.ID,
            MusicbillProperty.COVER,
            MusicbillProperty.NAME,
          ].join(',')}
        FROM musicbill
        WHERE ${MusicbillProperty.USER_ID} = ?
          AND ${MusicbillProperty.PUBLIC} = 1
        ORDER BY ${MusicbillProperty.CREATE_TIMESTAMP} DESC
        LIMIT 100
      `,
      [id],
    ),
    db.all<
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
          ${[
            MusicProperty.ID,
            MusicProperty.TYPE,
            MusicProperty.NAME,
            MusicProperty.ALIASES,
            MusicProperty.COVER,
            MusicProperty.SQ,
            MusicProperty.HQ,
            MusicProperty.AC,
          ].join(',')}
        FROM music
        WHERE createUserId = ?
        ORDER BY heat DESC
        LIMIT 100
      `,
      [id],
    ),
  ]);

  const musicIdMapSingers: {
    [key: string]: {
      id: string;
      name: string;
      aliases: string[];
    }[];
  } = {};
  if (musicList.length) {
    const allSingerList = await getSingerListInMusicIds(
      Array.from(new Set(musicList.map((m) => m.id))),
      [SingerProperty.ID, SingerProperty.NAME, SingerProperty.ALIASES],
    );
    for (const singer of allSingerList) {
      if (!musicIdMapSingers[singer.musicId]) {
        musicIdMapSingers[singer.musicId] = [];
      }
      musicIdMapSingers[singer.musicId].push({
        ...excludeProperty(singer, ['musicId']),
        aliases: singer.aliases ? singer.aliases.split(ALIAS_DIVIDER) : [],
      });
    }
  }

  return ctx.success({
    ...user,
    avatar: getAssetUrl(user.avatar, AssetType.USER_AVATAR),
    musicbillList: musicbillList.map((m) => ({
      ...m,
      cover: getAssetUrl(m.cover, AssetType.MUSICBILL_COVER),
    })),
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      cover: getAssetUrl(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetUrl(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetUrl(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetUrl(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSingers[m.id] || [],
    })),
  });
};
