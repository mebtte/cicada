import env from '@/env';
import { Context } from '../constants';

export default async (ctx: Context) =>
  ctx.success({
    version: env.VERSION,
  });
