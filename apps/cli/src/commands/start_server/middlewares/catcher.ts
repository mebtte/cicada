import { Context, Next } from 'koa';
import { EXCEPTION_CODE_MAP, ExceptionCode } from '#/constants/exception';
import { getConfig } from '@/config';
import logger from '../../../utils/logger';

export default () => async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (getConfig().mode === 'development') {
      console.error(error);
    }

    ctx.body = {
      code: ExceptionCode.SERVER_ERROR,
      message: EXCEPTION_CODE_MAP[ExceptionCode.SERVER_ERROR].description,
    };

    logger.error({
      label: 'server',
      title: 'catch error by catcher',
      error,
    });
  }
};
