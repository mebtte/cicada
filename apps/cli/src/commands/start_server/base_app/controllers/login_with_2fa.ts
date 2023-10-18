import { ExceptionCode } from '#/constants/exception';
import { sign } from '@/platform/jwt';
import getUserByUsername from '@/db/get_user_by_username';
import { UserProperty } from '@/constants/db_definition';
import { RequestBody, Response } from '#/server/base/login_with_2fa';
import md5 from 'md5';
import { UNUSED_2FA_SECRET_PREFIX } from '@/constants';
import * as twoFA from '@/platform/2fa';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { username, password, twoFAToken } = ctx.request.body as {
    [key in keyof RequestBody]: unknown;
  };

  if (
    typeof username !== 'string' ||
    !username.length ||
    typeof password !== 'string' ||
    !password.length ||
    typeof twoFAToken !== 'string' ||
    !twoFAToken.length
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const user = await getUserByUsername(username, [
    UserProperty.ID,
    UserProperty.PASSWORD,
    UserProperty.TOKEN_IDENTIFIER,
    UserProperty.TWO_FA_SECRET,
  ]);
  if (!user || user.password !== md5(md5(password))) {
    return ctx.except(ExceptionCode.WRONG_USERNAME_OR_PASSWORD);
  }

  if (
    !user.twoFASecret ||
    user.twoFASecret.startsWith(UNUSED_2FA_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.NO_NEED_TO_2FA);
  }

  if (!twoFA.validate({ token: twoFAToken, secret: user.twoFASecret })) {
    return ctx.except(ExceptionCode.WRONG_2FA_TOKEN);
  }

  const token = sign({
    userId: user.id,
    tokenIdentifier: user.tokenIdentifier,
  });
  return ctx.success<Response>(token);
};
