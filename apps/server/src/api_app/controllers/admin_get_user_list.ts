import { getDB } from '@/db';
import { User } from '@/db/user';
import { getAssetPublicPath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const userList = await getDB().all<User>(
    `
      SELECT
        id,
        email,
        nickname,
        avatar,
        joinTimestamp,
        admin,
        remark
      FROM user
      ORDER BY joinTimestamp DESC
    `,
    [],
  );
  return ctx.success(
    userList.map((user) => ({
      ...user,
      avatar: getAssetPublicPath(user.avatar, AssetType.USER_AVATAR),
    })),
  );
};
