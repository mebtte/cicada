import { Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import env from '@/env';
import { Context } from '../constants/koa';

export default async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (env.RUNENV === 'development') {
      console.error(error);
    }
    ctx.except(ExceptionCode.SERVER_ERROR);
  }
};
