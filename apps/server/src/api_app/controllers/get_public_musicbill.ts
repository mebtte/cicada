import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import excludeProperty from '#/utils/exclude_property';
import db from '@/db';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  getMusicbillById,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import {
  getSingerListInMusicIds,
  Property as SingerProperty,
} from '@/db/singer';
import { getUserById, Property as UserProperty } from '@/db/user';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.request.query as { id: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [
    MusicbillProperty.ID,
    MusicbillProperty.NAME,
    MusicbillProperty.COVER,
    MusicbillProperty.CREATE_TIMESTAMP,
    MusicbillProperty.PUBLIC,
    MusicbillProperty.USER_ID,
  ]);
  if (!musicbill || !musicbill.public) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const [user, musicList] = await Promise.all([
    getUserById(musicbill.userId, [
      UserProperty.ID,
      UserProperty.NICKNAME,
      UserProperty.AVATAR,
    ]),
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
          m.id,
          m.type,
          m.name,
          m.aliases,
          m.cover,
          m.sq,
          m.hq,
          m.ac
        FROM musicbill_music AS mm
        LEFT JOIN music AS m
          ON mm.musicId = m.id
        WHERE mm.musicbillId = ?
        ORDER BY mm.addTimestamp DESC
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
    ...excludeProperty(musicbill, [
      MusicbillProperty.PUBLIC,
      MusicbillProperty.USER_ID,
    ]),
    cover: getAssetUrl(musicbill.cover, AssetType.MUSICBILL_COVER),
    user: {
      ...user,
      avatar: getAssetUrl(user!.avatar, AssetType.USER_AVATAR),
    },
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
