import { getDB } from '@/db';
import { Response } from '#/server/api/admin_get_user_list';
import { getAssetPublicPath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { USER_TABLE_NAME, User, UserProperty } from '@/constants/db_definition';
import excludeProperty from '#/utils/exclude_property';
import { UNUSED_2FA_SECRET_PREFIX } from '@/constants';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const userList = await getDB().all<
    Pick<
      User,
      | UserProperty.ID
      | UserProperty.USERNAME
      | UserProperty.NICKNAME
      | UserProperty.AVATAR
      | UserProperty.JOIN_TIMESTAMP
      | UserProperty.ADMIN
      | UserProperty.REMARK
      | UserProperty.MUSICBILL_MAX_AMOUNT
      | UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY
      | UserProperty.LAST_ACTIVE_TIMESTAMP
      | UserProperty.MUSIC_PLAY_RECORD_INDATE
      | UserProperty.TWO_FA_SECRET
    >
  >(
    `
      SELECT
        ${UserProperty.ID},
        ${UserProperty.USERNAME},
        ${UserProperty.NICKNAME},
        ${UserProperty.AVATAR},
        ${UserProperty.JOIN_TIMESTAMP},
        ${UserProperty.ADMIN},
        ${UserProperty.REMARK},
        ${UserProperty.MUSICBILL_MAX_AMOUNT},
        ${UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY},
        ${UserProperty.LAST_ACTIVE_TIMESTAMP},
        ${UserProperty.MUSIC_PLAY_RECORD_INDATE},
        ${UserProperty.TWO_FA_SECRET}
      FROM ${USER_TABLE_NAME}
      ORDER BY ${UserProperty.JOIN_TIMESTAMP} DESC
    `,
    [],
  );
  return ctx.success<Response>(
    userList.map((user) => ({
      ...excludeProperty(user, [UserProperty.TWO_FA_SECRET]),
      avatar: getAssetPublicPath(user.avatar, AssetType.USER_AVATAR),
      twoFAEnabled: Boolean(
        user.twoFASecret &&
          !user.twoFASecret.startsWith(UNUSED_2FA_SECRET_PREFIX),
      ),
    })),
  );
};
