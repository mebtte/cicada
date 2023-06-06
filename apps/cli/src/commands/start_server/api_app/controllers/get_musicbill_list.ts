import { Response } from '#/server/api/get_musicbill_list';
import { AssetType } from '#/constants';
import { getAssetPublicPath } from '@/platform/asset';
import {
  MUSICBILL_TABLE_NAME,
  Musicbill,
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbill,
  SharedMusicbillProperty,
  USER_TABLE_NAME,
  User,
  UserProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import excludeProperty from '#/utils/exclude_property';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const musicbillList = await getDB().all<Musicbill>(
    `
      SELECT
        mb.${MusicbillProperty.ID},
        mb.${MusicbillProperty.COVER},
        mb.${MusicbillProperty.NAME},
        mb.${MusicbillProperty.PUBLIC},
        mb.${MusicbillProperty.CREATE_TIMESTAMP},
        mb.${MusicbillProperty.USER_ID}
      FROM ${MUSICBILL_TABLE_NAME} AS mb
      LEFT JOIN ${SHARED_MUSICBILL_TABLE_NAME} AS smb
        ON mb.${MusicbillProperty.ID} = smb.${SharedMusicbillProperty.MUSICBILL_ID}
        AND smb.${SharedMusicbillProperty.ACCEPTED} = 1
      WHERE mb.${MusicbillProperty.USER_ID} = ?
        OR smb.${SharedMusicbillProperty.SHARED_USER_ID} = ?
    `,
    [ctx.user.id, ctx.user.id],
  );
  const musicbillOwnerIds = Array.from(
    new Set(musicbillList.map((mb) => mb.userId)),
  );
  const [ownerUserList, sharedUserList] = await Promise.all([
    getDB().all<
      Pick<User, UserProperty.ID | UserProperty.AVATAR | UserProperty.NICKNAME>
    >(
      `
      SELECT
        ${UserProperty.ID},
        ${UserProperty.AVATAR},
        ${UserProperty.NICKNAME}
      FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.ID} IN ( ${musicbillOwnerIds
        .map(() => '?')
        .join(', ')} ) 
    `,
      musicbillOwnerIds,
    ),
    getDB().all<
      Pick<
        User,
        UserProperty.ID | UserProperty.AVATAR | UserProperty.NICKNAME
      > &
        Pick<
          SharedMusicbill,
          | SharedMusicbillProperty.ACCEPTED
          | SharedMusicbillProperty.MUSICBILL_ID
        >
    >(
      `
        SELECT
          u.${UserProperty.ID},
          u.${UserProperty.AVATAR},
          u.${UserProperty.NICKNAME},
          smb.${SharedMusicbillProperty.ACCEPTED},
          smb.${SharedMusicbillProperty.MUSICBILL_ID}
        FROM ${SHARED_MUSICBILL_TABLE_NAME} AS smb
        JOIN ${USER_TABLE_NAME} AS u
          ON smb.${SharedMusicbillProperty.SHARED_USER_ID} = u.${
        UserProperty.ID
      }
        WHERE ${SharedMusicbillProperty.MUSICBILL_ID} IN ( ${musicbillList
        .map(() => '?')
        .join(', ')} )
      `,
      musicbillList.map((mb) => mb.id),
    ),
  ]);

  return ctx.success<Response>(
    musicbillList.map((mb) => {
      const owner = ownerUserList.find((u) => u.id === mb.userId)!;
      return {
        id: mb.id,
        name: mb.name,
        createTimestamp: mb.createTimestamp,
        cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
        public: !!mb.public,
        owner: {
          ...owner,
          avatar: getAssetPublicPath(owner.avatar, AssetType.USER_AVATAR),
        },
        sharedUserList: sharedUserList
          .filter((u) => u.musicbillId === mb.id)
          .map((u) => ({
            ...excludeProperty(u, [SharedMusicbillProperty.MUSICBILL_ID]),
            avatar: getAssetPublicPath(u.avatar, AssetType.USER_AVATAR),
            accepted: !!u.accepted,
          })),
      };
    }),
  );
};
