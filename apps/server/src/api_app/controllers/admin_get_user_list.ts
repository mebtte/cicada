import db from '@/db';
import { User } from '@/db/user';
import { getAssetUrl } from '@/platform/asset';
import { AssetType } from '#/constants';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const userList = await db.all<User>(
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
      avatar: getAssetUrl(user.avatar, AssetType.USER_AVATAR),
    })),
  );
};
