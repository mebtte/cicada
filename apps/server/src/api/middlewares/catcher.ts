import { Context, Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';

export default async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    ctx.error(ExceptionCode.SERVER_ERROR);
  }
};
