import { ExceptionCode } from '#/constants/exception';
import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { keyword } = ctx.query as { keyword: unknown };
  if (
    typeof keyword !== 'string' ||
    !keyword.length ||
    keyword.length > SEARCH_KEYWORD_MAX_LENGTH
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  return ctx.success();
};
