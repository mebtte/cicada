import { ExceptionCode } from '#/constants/exception';
import { NAME_MAX_LENGTH } from '#/constants/singer';
import { SingerProperty } from '@/constants/db_definition';
import { getSingerByName, createSinger } from '@/db/singer';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { name, force } = ctx.request.body as {
    name?: unknown;
    force?: unknown;
  };
  if (
    typeof name !== 'string' ||
    !name.length ||
    name.length > NAME_MAX_LENGTH ||
    name.trim() !== name ||
    typeof force !== 'boolean'
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  if (!force) {
    const existSinger = await getSingerByName(name, [SingerProperty.ID]);
    if (existSinger) {
      return ctx.except(ExceptionCode.SINGER_EXIST);
    }
  }

  const id = await createSinger({ name, createUserId: ctx.user.id });
  return ctx.success(id);
};
