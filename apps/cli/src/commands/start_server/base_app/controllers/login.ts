import { ExceptionCode } from '#/constants/exception';
import { sign } from '@/platform/jwt';
import getUserByUsername from '@/db/get_user_by_username';
import { UserProperty } from '@/constants/db_definition';
import { RequestBody, Response } from '#/server/base/login';
import md5 from 'md5';
import { UNUSED_2FA_SECRET_PREFIX } from '@/constants';
import * as captcha from '@/platform/captcha';
import { Context } from '../constants';

const USER_LOGIN_INTERVAL = 3000;
const userLastLoginTime = new Map<string, number>();

function clearExpiredUserLastLoginTime(now: number) {
  for (const [username, lastLoginTime] of userLastLoginTime) {
    if (now - lastLoginTime >= USER_LOGIN_INTERVAL) {
      userLastLoginTime.delete(username);
    }
  }
}

export default async (ctx: Context) => {
  const { username, password, captchaId, captchaValue } = ctx.request.body as {
    [key in keyof RequestBody]: unknown;
  };

  if (
    typeof username !== 'string' ||
    !username.length ||
    typeof password !== 'string' ||
    !password.length ||
    typeof captchaId !== 'string' ||
    !captchaId.length ||
    typeof captchaValue !== 'string' ||
    !captchaValue.length
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const now = Date.now();
  clearExpiredUserLastLoginTime(now);
  const lastLoginTime = userLastLoginTime.get(username);
  if (
    typeof lastLoginTime === 'number' &&
    now - lastLoginTime < USER_LOGIN_INTERVAL
  ) {
    return ctx.except(ExceptionCode.LOGIN_TOO_FREQUENT);
  }
  userLastLoginTime.set(username, now);

  const captchaVerified = await captcha.verify({
    id: captchaId,
    value: captchaValue,
  });
  if (!captchaVerified) {
    return ctx.except(ExceptionCode.WRONG_CAPTCHA);
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
    user.twoFASecret &&
    !user.twoFASecret.startsWith(UNUSED_2FA_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.NEED_2FA);
  }

  const token = sign({
    userId: user.id,
    tokenIdentifier: user.tokenIdentifier,
  });
  return ctx.success<Response>(token);
};
