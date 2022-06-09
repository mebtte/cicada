import pkg from '../../../../../package.json';
import { Context } from '../constants';

export default async (ctx: Context) =>
  ctx.success({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    version: (pkg as any).version,
  });
