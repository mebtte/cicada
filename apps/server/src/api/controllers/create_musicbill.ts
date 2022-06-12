import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import { ExceptionCode } from '#/constants/exception';
import { createMusicbill } from '@/db/musicbill';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { name } = ctx.request.body as { name?: string };

  if (
    typeof name !== 'string' ||
    !name.length ||
    name.length > NAME_MAX_LENGTH
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const id = await createMusicbill({ userId: ctx.user.id, name });
  return ctx.success(id);
};
