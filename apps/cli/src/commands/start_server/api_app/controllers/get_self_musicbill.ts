import { Response } from '#/server/api/get_self_musicbill';
import { ALIAS_DIVIDER, AssetType, MusicbillSharedStatus } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { getSingerListInMusicIds } from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import { getAssetPublicPath } from '@/platform/asset';
import { getDB } from '@/db';
import {
  Music,
  MusicProperty,
  MUSIC_TABLE_NAME,
  SingerProperty,
  MusicbillProperty,
  MusicbillMusicProperty,
  MUSICBILL_MUSIC_TABLE_NAME,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbillProperty,
  SharedMusicbill,
} from '@/constants/db_definition';
import { getMusicbillById } from '@/db/musicbill';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };

  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  /**
   * 1. 乐单是否存在
   * 2. 是否乐单创建者
   * 3. 是否拥有共享乐单
   * @author mebtte<hi@mebtte.com>
   */
  const musicbill = await getMusicbillById(id, [
    MusicbillProperty.ID,
    MusicbillProperty.COVER,
    MusicbillProperty.NAME,
    MusicbillProperty.PUBLIC,
    MusicbillProperty.CREATE_TIMESTAMP,
    MusicbillProperty.USER_ID,
  ]);
  if (!musicbill) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }
  const shareToUsers = await getDB().all<
    Pick<SharedMusicbill, SharedMusicbillProperty.SHARED_USER_ID>
  >(
    `
      SELECT
        ${SharedMusicbillProperty.SHARED_USER_ID}
      FROM ${SHARED_MUSICBILL_TABLE_NAME}
      WHERE ${SharedMusicbillProperty.MUSICBILL_ID} = ?
    `,
    [id],
  );
  if (
    musicbill.userId !== ctx.user.id &&
    !shareToUsers.find((u) => u.sharedUserId === ctx.user.id)
  ) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const musicList = await getDB().all<
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
      FROM
        ${MUSICBILL_MUSIC_TABLE_NAME} AS mm
        LEFT JOIN ${MUSIC_TABLE_NAME} AS m ON mm.${MusicbillMusicProperty.MUSIC_ID} = m.${MusicProperty.ID}
      WHERE
        mm.${MusicbillMusicProperty.MUSICBILL_ID} = ?
      ORDER BY
        mm.${MusicbillMusicProperty.ADD_TIMESTAMP} DESC;
    `,
    [id],
  );

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

  return ctx.success<Response>({
    ...excludeProperty(musicbill, [MusicbillProperty.USER_ID]),
    cover: getAssetPublicPath(musicbill.cover, AssetType.MUSICBILL_COVER),
    shareStatus:
      musicbill.userId === ctx.user.id
        ? shareToUsers.length
          ? MusicbillSharedStatus.SHARE_TO_OTHERS
          : MusicbillSharedStatus.NOT_SHARE
        : MusicbillSharedStatus.SHARE_TO_ME,
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingers[m.id] || [],
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      asset: getAssetPublicPath(m.asset, AssetType.MUSIC),
    })),
  });
};
