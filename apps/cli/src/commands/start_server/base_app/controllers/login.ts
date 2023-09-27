import { ExceptionCode } from '#/constants/exception';
import { sign } from '@/platform/jwt';
import getUserByUsername from '@/db/get_user_by_username';
import { UserProperty } from '@/constants/db_definition';
import { RequestBody, Response } from '#/server/base/login';
import md5 from 'md5';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { username, password, totpToken } = ctx.request.body as {
    [key in keyof RequestBody]: unknown;
  };

  if (
    typeof username !== 'string' ||
    !username.length ||
    typeof password !== 'string' ||
    !password.length
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserByUsername(username, [
    UserProperty.ID,
    UserProperty.PASSWORD,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.WRONG_USERNAME_OR_PASSWORD);
  }

  if (user.password !== md5(md5(password))) {
    return ctx.except(ExceptionCode.WRONG_USERNAME_OR_PASSWORD);
  }

  const token = sign(user.id);
  return ctx.success<Response>(token);
};
