import fs from 'fs';
import util from 'util';
import { Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import env from '@/env';
import { LOG_DIR } from '@/constants/directory';
import day from '#/utils/day';
import { Context } from '../constants/koa';

const appendFileAsync = util.promisify(fs.appendFile);

export default async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (env.RUN_ENV === 'development') {
      console.error(error);
    }
    ctx.except(ExceptionCode.SERVER_ERROR);

    const now = day();
    const dateString = now.format('YYYYMMDD');
    const timeString = now.format('HH:mm:ss');
    appendFileAsync(
      `${LOG_DIR}/server_error_${dateString}.log`,
      `[${timeString}] ${ctx.path}\n${error.stack}\n\n`,
    ).catch((e) => console.error(e));
  }
};
