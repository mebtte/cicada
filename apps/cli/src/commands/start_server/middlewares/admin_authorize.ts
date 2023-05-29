import { ExceptionCode } from '#/constants/exception';
import { Next } from 'koa';
import { Context } from '@/constants/koa';

export default async (ctx: Context, next: Next) => {
  if (ctx.user.admin) {
    return next();
  }
  return ctx.except(ExceptionCode.NOT_AUTHORIZE_ADMIN);
};
