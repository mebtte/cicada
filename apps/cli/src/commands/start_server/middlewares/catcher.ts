import { Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import { getConfig } from '@/config';
import { Context } from '../../../constants/koa';
import logger from '../../../utils/logger';

export default () => async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (getConfig().mode === 'development') {
      console.error(error);
    }

    ctx.except(ExceptionCode.SERVER_ERROR, 500);

    logger.error({
      label: 'server_error',
      title: 'catch error by catcher',
      error,
    });
  }
};
