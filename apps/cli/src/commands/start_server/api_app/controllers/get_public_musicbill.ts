import GetPublicMusicbill from '#/server/api/get_public_musicbill';
import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import excludeProperty from '#/utils/exclude_property';
import {
  Music,
  MusicProperty,
  UserProperty,
  SingerProperty,
  MusicbillProperty,
  MusicbillCollectionProperty,
  MusicbillMusicProperty,
  MUSICBILL_MUSIC_TABLE_NAME,
  MUSIC_TABLE_NAME,
  MUSICBILL_COLLECTION_TABLE_NAME,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import { getMusicbillById } from '@/db/musicbill';
import { getMusicbillCollection } from '@/db/musicbill_collection';
import { getSingerListInMusicIds } from '@/db/singer';
import { getUserById } from '@/db/user';
import { getAssetPublicPath } from '@/platform/asset';
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

  const [user, musicList, collectionCount, musicbillCollection] =
    await Promise.all([
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
        FROM ${MUSICBILL_MUSIC_TABLE_NAME} AS mm
        LEFT JOIN ${MUSIC_TABLE_NAME} AS m
          ON mm.${MusicbillMusicProperty.MUSIC_ID} = m.${MusicProperty.ID}
        WHERE mm.${MusicbillMusicProperty.MUSICBILL_ID} = ?
        ORDER BY mm.${MusicbillMusicProperty.ADD_TIMESTAMP} DESC
      `,
        [id],
      ),
      getDB().get<{ value: number }>(
        `
          SELECT
            count(*) AS value
          FROM ${MUSICBILL_COLLECTION_TABLE_NAME}
          WHERE ${MusicbillCollectionProperty.MUSICBILL_ID} = ?
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

  return ctx.success<GetPublicMusicbill>({
    ...excludeProperty(musicbill, [
      MusicbillProperty.PUBLIC,
      MusicbillProperty.USER_ID,
    ]),
    cover: getAssetPublicPath(musicbill.cover, AssetType.MUSICBILL_COVER),
    user: {
      ...user!,
      avatar: getAssetPublicPath(user!.avatar, AssetType.USER_AVATAR),
    },
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingers[m.id] || [],
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      asset: getAssetPublicPath(m.asset, AssetType.MUSIC),
    })),
    collectionCount: collectionCount!.value,

    collected: !!musicbillCollection,
  });
};
