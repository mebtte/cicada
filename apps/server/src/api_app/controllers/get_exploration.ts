import { ALIAS_DIVIDER } from '#/constants';
import { getDB } from '@/db';
import { Musicbill, Property as MusicbillProperty } from '@/db/musicbill';
import {
  Singer,
  Property as SingerProperty,
  getSingerListInMusicIds,
} from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import {
  Music,
  MusicProperty,
  User,
  UserProperty,
} from '@/constants/db_definition';
import { Context } from '../constants';

const QUALITY = 20;

type MusicbillCreateUser = Pick<User, UserProperty.ID | UserProperty.NICKNAME>;
type MusicSinger = Pick<
  Singer,
  SingerProperty.ID | SingerProperty.NAME | SingerProperty.ALIASES
> & {
  musicId: string;
};

export default async (ctx: Context) => {
  const [musicList, singerList, musicbillList] = await Promise.all([
    getDB().all<
      Pick<Music, MusicProperty.ID | MusicProperty.NAME | MusicProperty.COVER>
    >(
      `
        SELECT
          id,
          name,
          cover
        FROM music
        WHERE cover != ''
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
          id,
          name,
          aliases,
          avatar
        FROM singer
        WHERE avatar != ''
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
          id,
          cover,
          name,
          userId
        FROM musicbill
        WHERE public = 1
          AND cover != ''
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
          [SingerProperty.ID, SingerProperty.NAME, SingerProperty.ALIASES],
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
      singers: musicSingerList
        .filter((s) => s.musicId === m.id)
        .map((s) => excludeProperty(s, ['musicId'])),
    })),
    singerList: singerList.map((s) => ({
      ...s,
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
    })),
    musicbillList: musicbillList.map((mb) => ({
      ...excludeProperty(mb, [MusicbillProperty.USER_ID]),
      user: musicbillCreateUserList.find((u) => mb.userId === u.id)!,
    })),
  });
};
