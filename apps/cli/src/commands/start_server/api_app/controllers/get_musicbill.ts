import { Response } from '#/server/api/get_musicbill';
import { ALIAS_DIVIDER, AssetType } from '#/constants';
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
  MUSICBILL_TABLE_NAME,
  USER_TABLE_NAME,
  UserProperty,
  Musicbill,
} from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };

  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  /**
   * 1. 乐单是否存在
   * 2. 是否乐单创建者
   * 3. 是否拥有共享乐单
   * @author mebtte<i@mebtte.com>
   */
  const musicbill = await getDB().get<
    Pick<
      Musicbill,
      | MusicbillProperty.ID
      | MusicbillProperty.NAME
      | MusicbillProperty.COVER
      | MusicbillProperty.CREATE_TIMESTAMP
      | MusicbillProperty.PUBLIC
      | MusicbillProperty.USER_ID
    > & {
      userAvatar: string;
      userNickname: string;
    }
  >(
    `
      SELECT
        mb.${MusicbillProperty.ID},
        mb.${MusicbillProperty.NAME},
        mb.${MusicbillProperty.COVER},
        mb.${MusicbillProperty.CREATE_TIMESTAMP},
        mb.${MusicbillProperty.PUBLIC},
        mb.${MusicbillProperty.USER_ID},
        u.${UserProperty.NICKNAME} AS userNickname,
        u.${UserProperty.AVATAR} AS userAvatar
      FROM ${MUSICBILL_TABLE_NAME} AS mb
      JOIN ${USER_TABLE_NAME} AS u
        ON mb.${MusicbillProperty.USER_ID} = u.${UserProperty.ID}
      WHERE mb.${MusicbillProperty.ID} = ?
    `,
    [id],
  );
  if (!musicbill) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
  }
  const sharedUserList = await getDB().all<
    Pick<
      SharedMusicbill,
      SharedMusicbillProperty.ACCEPTED | SharedMusicbillProperty.SHARED_USER_ID
    > & {
      userNickname: string;
      userAvatar: string;
    }
  >(
    `
      SELECT
        smb.${SharedMusicbillProperty.ACCEPTED},
        smb.${SharedMusicbillProperty.SHARED_USER_ID},
        u.${UserProperty.NICKNAME} AS userNickname,
        u.${UserProperty.AVATAR} AS userAvatar
      FROM ${SHARED_MUSICBILL_TABLE_NAME} AS smb
      JOIN ${USER_TABLE_NAME} AS u
        ON smb.${SharedMusicbillProperty.SHARED_USER_ID} = u.${UserProperty.ID}
      WHERE ${SharedMusicbillProperty.MUSICBILL_ID} = ?
    `,
    [id],
  );
  const sharedUser = sharedUserList.find((u) => u.sharedUserId === ctx.user.id);
  if (
    musicbill.userId !== ctx.user.id &&
    (!sharedUser || sharedUser.accepted !== 1)
  ) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXISTED);
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

  const musicIdMapSingers: Record<string, {
      id: string;
      name: string;
      aliases: string[];
    }[]> = {};
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
    id: musicbill.id,
    name: musicbill.name,
    createTimestamp: musicbill.createTimestamp,
    public: !!musicbill.public,
    cover: getAssetPublicPath(musicbill.cover, AssetType.MUSICBILL_COVER),
    owner: {
      id: musicbill.userId,
      nickname: musicbill.userNickname,
      avatar: getAssetPublicPath(musicbill.userAvatar, AssetType.USER_AVATAR),
    },
    sharedUserList: sharedUserList.map((u) => ({
      id: u.sharedUserId,
      nickname: u.userNickname,
      avatar: getAssetPublicPath(u.userAvatar, AssetType.USER_AVATAR),
      accepted: !!u.accepted,
    })),
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      singers: musicIdMapSingers[m.id] || [],
      cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      asset: getAssetPublicPath(m.asset, AssetType.MUSIC),
    })),
  });
};
