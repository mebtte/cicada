import { ExceptionCode } from '#/constants/exception';
import { sign } from '@/platform/jwt';
import getUserByUsername from '@/db/get_user_by_username';
import { UserProperty } from '@/constants/db_definition';
import { RequestBody, Response } from '#/server/base/login';
import md5 from 'md5';
import { UNUSED_TOTP_SECRET_PREFIX } from '@/constants';
import * as totp from '@/platform/totp';
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
    UserProperty.TOKEN_IDENTIFIER,
    UserProperty.TOTP_SECRET,
  ]);
  if (!user) {
    return ctx.except(ExceptionCode.WRONG_USERNAME_OR_PASSWORD);
  }

  if (user.password !== md5(md5(password))) {
    return ctx.except(ExceptionCode.WRONG_USERNAME_OR_PASSWORD);
  }

  if (
    user.totpSecret &&
    !user.totpSecret.startsWith(UNUSED_TOTP_SECRET_PREFIX)
  ) {
    if (typeof totpToken !== 'string' || !totpToken.length) {
      return ctx.except(ExceptionCode.LACK_OF_TOTP_TOKEN);
    }
    if (!totp.validate({ token: totpToken, secret: user.totpSecret })) {
      return ctx.except(ExceptionCode.WRONG_TOTP_TOKEN);
    }
  }

  const token = sign({
    userId: user.id,
    tokenIdentifier: user.tokenIdentifier,
  });
  return ctx.success<Response>(token);
};
