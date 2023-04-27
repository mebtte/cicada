import { getDB } from '@/db';
import { getAssetPublicPath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { User } from '@/constants/db_definition';
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
        remark,
        musicbillMaxAmount,
        createMusicMaxAmountPerDay,
        exportMusicbillMaxTimePerDay
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
