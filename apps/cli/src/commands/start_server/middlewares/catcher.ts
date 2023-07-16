import { Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import { getConfig } from '@/config';
import logger from '../../../utils/logger';
import { Context } from '../constants';
import { EXCEPTION_CODE_MAP_KEY } from '../constants/exception';

export default () => async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (getConfig().mode === 'development') {
      console.error(error);
    }

    ctx.body = {
      code: ExceptionCode.SERVER_ERROR,
      message: ctx.t(EXCEPTION_CODE_MAP_KEY[ExceptionCode.SERVER_ERROR]),
    };

    logger.error({
      label: 'server',
      title: 'catch error by catcher',
      error,
    });
  }
};
