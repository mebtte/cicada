import { AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { verify } from '@/platform/jwt';
import { Context, Next } from 'koa';
import { getAssetPublicPath } from '@/platform/asset';
import { getUserById } from '@/db/user';
import { User, UserProperty } from '@/constants/db_definition';
import { ParasiteMiddleware } from './parasite';

export interface AuthorizeMiddleware {
  user: User;
}

export default async (
  ctx: Context & ParasiteMiddleware & AuthorizeMiddleware,
  next: Next,
) => {
  const token = ctx.get('authorization');

  if (!token) {
    return ctx.except(ExceptionCode.NOT_AUTHORIZED);
  }

  let userId: string;
  try {
    userId = verify(token);
  } catch (error) {
    return ctx.except(ExceptionCode.NOT_AUTHORIZED);
  }

  const user = await getUserById(userId, Object.values(UserProperty));

  if (!user) {
    return ctx.except(ExceptionCode.NOT_AUTHORIZED);
  }

  ctx.user = {
    ...user,
    avatar: getAssetPublicPath(user.avatar, AssetType.USER_AVATAR),
  };
  return next();
};
