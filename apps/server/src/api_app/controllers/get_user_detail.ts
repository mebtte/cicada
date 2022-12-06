import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { getUserById, Property as UserProperty } from '@/db/user';
import { getAssetPublicPath } from '@/platform/asset';
import { getDB } from '@/db';
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
    getDB().all<
      Pick<
        Musicbill,
        MusicbillProperty.ID | MusicbillProperty.COVER | MusicbillProperty.NAME
      > & {
        musicCount: number;
      }
    >(
      `
        SELECT
          m.id,
          m.cover,
          m.name,
          count(mm.id) as musicCount
        FROM musicbill AS m
        LEFT JOIN musicbill_music AS mm
          ON mm.musicbillId = m.id
        WHERE m.userId = ?
          AND m.public = 1
        GROUP BY m.id
        ORDER BY m.createTimestamp DESC
        LIMIT 100
      `,
      [id],
    ),
    getDB().all<
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
    avatar: getAssetPublicPath(user.avatar, AssetType.USER_AVATAR),
    musicbillList: musicbillList.map((m) => ({
      ...m,
      cover: getAssetPublicPath(m.cover, AssetType.MUSICBILL_COVER),
    })),
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetPublicPath(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetPublicPath(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetPublicPath(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSingers[m.id] || [],
    })),
  });
};
