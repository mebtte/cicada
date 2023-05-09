import { ALIAS_DIVIDER } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import excludeProperty from '#/utils/exclude_property';
import {
  Music,
  MusicProperty,
  Singer,
  SingerProperty,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getSingerById, getSingerListInMusicIds } from '@/db/singer';
import { getUserById } from '@/db/user';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const singer = await getSingerById(id, [
    SingerProperty.ID,
    SingerProperty.NAME,
    SingerProperty.ALIASES,
    SingerProperty.AVATAR,
    SingerProperty.CREATE_TIMESTAMP,
    SingerProperty.CREATE_USER_ID,
  ]);
  if (!singer) {
    return ctx.except(ExceptionCode.SINGER_NOT_EXIST);
  }

  const [createUser, musicList] = await Promise.all([
    getUserById(singer.createUserId, [
      UserProperty.ID,
      UserProperty.AVATAR,
      UserProperty.NICKNAME,
    ]),
    getDB().all<
      Pick<
        Music,
        | MusicProperty.ID
        | MusicProperty.TYPE
        | MusicProperty.NAME
        | MusicProperty.ALIASES
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
        FROM music AS m
        LEFT JOIN music_singer_relation AS msr
          ON m.id = msr.musicId
        WHERE msr.singerId = ?
        ORDER BY m.heat DESC
      `,
      [id],
    ),
  ]);

  const musicIdMapSingers: {
    [key: string]: (Pick<Singer, SingerProperty.ID | SingerProperty.NAME> & {
      aliases: string[];
    })[];
  } = {};
  if (musicList.length) {
    const allSingerList = await getSingerListInMusicIds(
      Array.from(new Set(musicList.map((m) => m.id))),
      [SingerProperty.ID, SingerProperty.NAME, SingerProperty.ALIASES],
    );
    allSingerList.forEach((s) => {
      if (!musicIdMapSingers[s.musicId]) {
        musicIdMapSingers[s.musicId] = [];
      }
      musicIdMapSingers[s.musicId].push({
        ...excludeProperty(s, ['musicId']),
        aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
      });
    });
  }

  return ctx.success({
    ...excludeProperty(singer, [SingerProperty.CREATE_USER_ID]),
    aliases: singer.aliases ? singer.aliases.split(ALIAS_DIVIDER) : [],
    createUser,
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingers[m.id] || [],
    })),
  });
};
