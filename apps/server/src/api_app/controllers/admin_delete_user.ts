import { ExceptionCode } from '#/constants/exception';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }
};
