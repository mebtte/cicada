import { ExceptionCode } from '#/constants/exception';
import { EMAIL } from '#/constants/regexp';
import { Property, getUserByEmail } from '@/platform/user';
import * as db from '@/platform/db';
import generateRandomInteger from '#/utils/generate_random_integer';
import { REMARK_MAX_LENGTH } from '#/constants/user';
import { Context } from '../constants/koa';

export default async (ctx: Context) => {
  const { email, remark = '' } = ctx.body as {
    email?: string;
    remark?: string;
  };

  if (
    typeof email !== 'string' ||
    !EMAIL.test(email) ||
    typeof remark !== 'string' ||
    remark.length > REMARK_MAX_LENGTH
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserByEmail(email, [Property.ID]);
  if (user) {
    return ctx.except(ExceptionCode.EMAIL_EXISTED);
  }

  const id = generateRandomInteger(1_0000_0000, 10_0000_0000).toString();
  await db.run(
    `
      insert into user(id, email, nickname, joinTimestamp, remark)
        values(?, ?, ?, ?, ?)
    `,
    [id, email, id, Date.now(), remark],
  );

  return ctx.success();
};
