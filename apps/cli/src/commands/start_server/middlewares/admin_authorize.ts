import { ExceptionCode } from '#/constants/exception';
import { Context, Next } from 'koa';
import { ParasiteMiddleware } from './parasite';

export default async (ctx: Context & ParasiteMiddleware, next: Next) => {
  if (ctx.user.admin) {
    return next();
  }
  return ctx.except(ExceptionCode.NOT_AUTHORIZED_FOR_ADMIN);
};
