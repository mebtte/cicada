import pkg from '../../../../../package.json';
import { Context } from '../constants/koa';

export default async (ctx: Context) =>
  ctx.success({
    version: pkg.version,
  });
