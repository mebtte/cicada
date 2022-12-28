import fs from 'fs';
import util from 'util';
import { Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import day from '#/utils/day';
import { getLogDirectory } from '@/config';
import { Context } from '../constants/koa';

const appendFileAsync = util.promisify(fs.appendFile);

export default async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    ctx.except(ExceptionCode.SERVER_ERROR);

    const now = day();
    const dateString = now.format('YYYYMMDD');
    const timeString = now.format('HH:mm:ss');
    appendFileAsync(
      `${getLogDirectory()}/server_error_${dateString}.log`,
      `[${timeString}] ${ctx.path}\n${error.stack}\n\n`,
    ).catch((e) => console.error(e));
  }
};
