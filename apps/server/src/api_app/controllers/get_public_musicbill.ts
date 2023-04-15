import { ALIAS_DIVIDER } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import excludeProperty from '#/utils/exclude_property';
import { getDB } from '@/db';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  getMusicbillById,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import {
  getMusicbillCollection,
  Property as MusicbillCollectionProperty,
} from '@/db/musicbill_collection';
import {
  getSingerListInMusicIds,
  Property as SingerProperty,
} from '@/db/singer';
import { getUserById, Property as UserProperty } from '@/db/user';
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

  const [user, musicList, musicbillCollection] = await Promise.all([
    getUserById(musicbill.userId, [
      UserProperty.ID,
      UserProperty.NICKNAME,
      UserProperty.AVATAR,
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
          m.aliases
        FROM musicbill_music AS mm
        LEFT JOIN music AS m
          ON mm.musicId = m.id
        WHERE mm.musicbillId = ?
        ORDER BY mm.addTimestamp DESC
      `,
      [id],
    ),
    getMusicbillCollection({
      musicbillId: id,
      userId: ctx.user.id,
      properties: [MusicbillCollectionProperty.ID],
    }),
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
    user,
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingers[m.id] || [],
    })),

    collected: !!musicbillCollection,
  });
};
