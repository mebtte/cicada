import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { Response } from '#/server/api/get_singer';
import excludeProperty from '#/utils/exclude_property';
import {
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MUSIC_TABLE_NAME,
  Music,
  MusicProperty,
  MusicSingerRelation,
  MusicSingerRelationProperty,
  Singer,
  SingerProperty,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getSingerById, getSingerListInMusicIds } from '@/db/singer';
import { getUserById } from '@/db/user';
import { getAssetPublicPath } from '@/platform/asset';
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

  const [createUser, musicList, editable] = await Promise.all([
    getUserById(singer.createUserId, [UserProperty.ID, UserProperty.NICKNAME]),
    getDB().all<
      Pick<
        Music,
        | MusicProperty.ID
        | MusicProperty.TYPE
        | MusicProperty.NAME
        | MusicProperty.ALIASES
        | MusicProperty.COVER
        | MusicProperty.ASSET
      >
    >(
      `
        SELECT
          m.${MusicProperty.ID},
          m.${MusicProperty.TYPE},
          m.${MusicProperty.NAME},
          m.${MusicProperty.ALIASES},
          m.${MusicProperty.COVER},
          m.${MusicProperty.ASSET}
        FROM ${MUSIC_TABLE_NAME} AS m
        LEFT JOIN ${MUSIC_SINGER_RELATION_TABLE_NAME} AS msr
          ON m.${MusicProperty.ID} = msr.${MusicSingerRelationProperty.MUSIC_ID}
        WHERE msr.${MusicSingerRelationProperty.SINGER_ID} = ?
        ORDER BY m.${MusicProperty.HEAT} DESC
      `,
      [id],
    ),
    ctx.user.admin ||
      singer.createUserId === ctx.user.id ||
      getDB().get<Pick<MusicSingerRelation, MusicSingerRelationProperty.ID>>(
        `
          SELECT
            msr.${MusicSingerRelationProperty.ID}
          FROM ${MUSIC_SINGER_RELATION_TABLE_NAME} AS msr
          JOIN ${MUSIC_TABLE_NAME} AS m
            ON m.${MusicProperty.ID} = msr.${MusicSingerRelationProperty.MUSIC_ID}
              AND m.${MusicProperty.CREATE_USER_ID} = ?
          WHERE msr.${MusicSingerRelationProperty.SINGER_ID} = ?
          LIMIT 1
        `,
        [ctx.user.id, id],
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

  return ctx.success<Response>({
    ...excludeProperty(singer, [SingerProperty.CREATE_USER_ID]),
    avatar: getAssetPublicPath(singer.avatar, AssetType.SINGER_AVATAR),
    aliases: singer.aliases ? singer.aliases.split(ALIAS_DIVIDER) : [],
    createUser: createUser!,
    musicList: musicList.map((m) => ({
      ...m,
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      asset: getAssetPublicPath(m.asset, AssetType.MUSIC),
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingers[m.id] || [],
    })),

    editable: !!editable,
  });
};
