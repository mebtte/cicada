import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { getDB } from '@/db';
import { getSingerListInMusicIds } from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import {
  Music,
  MusicProperty,
  User,
  UserProperty,
  Singer,
  SingerProperty,
  Musicbill,
  MusicbillProperty,
  MUSIC_TABLE_NAME,
  SINGER_TABLE_NAME,
  MUSICBILL_TABLE_NAME,
} from '@/constants/db_definition';
import { getAssetPublicPath } from '@/platform/asset';
import { Context } from '../constants';

const QUALITY = 20;

type MusicbillCreateUser = Pick<User, UserProperty.ID | UserProperty.NICKNAME>;
type MusicSinger = Pick<Singer, SingerProperty.ID | SingerProperty.NAME> & {
  musicId: string;
};

export default async (ctx: Context) => {
  const [musicList, singerList, musicbillList] = await Promise.all([
    getDB().all<
      Pick<Music, MusicProperty.ID | MusicProperty.NAME | MusicProperty.COVER>
    >(
      `
        SELECT
          ${MusicProperty.ID},
          ${MusicProperty.NAME},
          ${MusicProperty.COVER}
        FROM ${MUSIC_TABLE_NAME}
        WHERE ${MusicProperty.COVER} != ''
        ORDER BY random()
        LIMIT ?
      `,
      [QUALITY],
    ),
    getDB().all<
      Pick<
        Singer,
        | SingerProperty.ID
        | SingerProperty.NAME
        | SingerProperty.ALIASES
        | SingerProperty.AVATAR
      >
    >(
      `
        SELECT
          ${SingerProperty.ID},
          ${SingerProperty.NAME},
          ${SingerProperty.ALIASES},
          ${SingerProperty.AVATAR}
        FROM ${SINGER_TABLE_NAME}
        WHERE ${SingerProperty.AVATAR} != ''
        ORDER BY random()
        LIMIT ?
      `,
      [QUALITY],
    ),
    getDB().all<
      Pick<
        Musicbill,
        | MusicbillProperty.ID
        | MusicbillProperty.COVER
        | MusicbillProperty.NAME
        | MusicbillProperty.USER_ID
      >
    >(
      `
        SELECT
          ${MusicbillProperty.ID},
          ${MusicbillProperty.COVER},
          ${MusicbillProperty.NAME},
          ${MusicbillProperty.USER_ID}
        FROM ${MUSICBILL_TABLE_NAME}
        WHERE ${MusicbillProperty.PUBLIC} = 1
          AND ${MusicbillProperty.COVER} != ''
        ORDER BY random()
        LIMIT ? 
      `,
      [QUALITY],
    ),
  ]);

  const [musicSingerList, musicbillCreateUserList]: [
    MusicSinger[],
    MusicbillCreateUser[],
  ] = await Promise.all([
    musicList.length
      ? getSingerListInMusicIds(
          musicList.map((m) => m.id),
          [SingerProperty.ID, SingerProperty.NAME],
        )
      : [],
    musicbillList.length
      ? getDB().all<MusicbillCreateUser>(
          `
            SELECT
              id,
              nickname
            FROM user
            WHERE id IN ( ${musicbillList.map(() => '?').join(', ')} )
          `,
          musicbillList.map((mb) => mb.userId),
        )
      : [],
  ]);

  return ctx.success({
    musicList: musicList.map((m) => ({
      ...m,
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      singers: musicSingerList
        .filter((s) => s.musicId === m.id)
        .map((s) => excludeProperty(s, ['musicId'])),
    })),
    singerList: singerList.map((s) => ({
      ...s,
      avatar: getAssetPublicPath(s.avatar, AssetType.SINGER_AVATAR),
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
    })),
    musicbillList: musicbillList.map((mb) => ({
      ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
      cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
      user: musicbillCreateUserList.find((u) => mb.userId === u.id)!,
    })),
  });
};
