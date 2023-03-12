import definition from '@/definition';
import { Context } from '../constants';

export default async (ctx: Context) =>
  ctx.success({
    version: definition.VERSION,
  });
