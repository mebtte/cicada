import { RequestParams } from '#/server/api/disable_totp';
import { UNUSED_TOTP_SECRET_PREFIX } from '@/constants';
import * as totp from '@/platform/totp';
import { ExceptionCode } from '#/constants/exception';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { totpToken } = ctx.query as { [key in keyof RequestParams]?: unknown };
  if (
    typeof totpToken !== 'string' ||
    totpToken.length !== totp.DIGITS ||
    !ctx.user.totpSecret ||
    !ctx.user.totpSecret.startsWith(UNUSED_TOTP_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }
};
