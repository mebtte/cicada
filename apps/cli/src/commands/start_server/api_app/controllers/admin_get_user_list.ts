import { getDB } from '@/db';
import AdminGetUserList from '#/server/api/admin_get_user_list';
import { getAssetPublicPath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { USER_TABLE_NAME, User, UserProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const userList = await getDB().all<
    Pick<
      User,
      | UserProperty.ID
      | UserProperty.EMAIL
      | UserProperty.NICKNAME
      | UserProperty.AVATAR
      | UserProperty.JOIN_TIMESTAMP
      | UserProperty.ADMIN
      | UserProperty.REMARK
      | UserProperty.MUSICBILL_MAX_AMOUNT
      | UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY
      | UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY
      | UserProperty.LAST_ACTIVE_TIMESTAMP
      | UserProperty.MUSIC_PLAY_RECORD_INDATE
    >
  >(
    `
      SELECT
        ${UserProperty.ID},
        ${UserProperty.EMAIL},
        ${UserProperty.NICKNAME},
        ${UserProperty.AVATAR},
        ${UserProperty.JOIN_TIMESTAMP},
        ${UserProperty.ADMIN},
        ${UserProperty.REMARK},
        ${UserProperty.MUSICBILL_MAX_AMOUNT},
        ${UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY},
        ${UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY},
        ${UserProperty.LAST_ACTIVE_TIMESTAMP},
        ${UserProperty.MUSIC_PLAY_RECORD_INDATE}
      FROM ${USER_TABLE_NAME}
      ORDER BY ${UserProperty.JOIN_TIMESTAMP} DESC
    `,
    [],
  );
  return ctx.success<AdminGetUserList>(
    userList.map((user) => ({
      ...user,
      avatar: getAssetPublicPath(user.avatar, AssetType.USER_AVATAR),
    })),
  );
};
