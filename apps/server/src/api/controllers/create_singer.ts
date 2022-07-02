import { ExceptionCode } from '#/constants/exception';
import { NAME_MAX_LENGTH } from '#/constants/singer';
import generateRandomString from '#/utils/generate_random_string';
import db from '@/db';
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
    const existSinger = await db.get<{ id?: string }>(
      `
        select id from singer where name = ?
      `,
      [name],
    );
    if (existSinger) {
      return ctx.except(ExceptionCode.SINGER_EXIST);
    }
  }

  const id = generateRandomString(6, false);
  await db.run(
    `
      insert into singer(id, name, createUserId, createTimestamp)
        values( ?, ?, ?, ? )
    `,
    [id, name, ctx.user.id, Date.now()],
  );
  return ctx.success(id);
};
