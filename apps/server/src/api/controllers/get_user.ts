import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { getUserById, Property as UserProperty } from '@/db/user';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserById(id, [
    UserProperty.ID,
    UserProperty.AVATAR,
    UserProperty.EMAIL,
    UserProperty.JOIN_TIMESTAMP,
    UserProperty.NICKNAME,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }

  return ctx.success({
    ...user,
    avatar: getAssetUrl(user.avatar, AssetType.USER_AVATAR),
  });
};
