import { Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import { Context } from '../constants/koa';
import logger from '../utils/logger';

export default ({ label }: { label: string }) =>
  async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      console.error(error);
      ctx.except(ExceptionCode.SERVER_ERROR, 500);

      logger.error({
        label,
        title: 'catch error by catcher',
        error,
      });
    }
  };
