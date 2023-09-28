import { RequestBody } from '#/server/api/enable_totp';
import * as totp from '@/platform/totp';
import { ExceptionCode } from '#/constants/exception';
import { UNUSED_TOTP_SECRET_PREFIX } from '@/constants';
import updateUser from '@/db/update_user';
import { UserProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { totpToken } = ctx.request.body as {
    [key in keyof RequestBody]?: unknown;
  };
  if (
    typeof totpToken !== 'string' ||
    totpToken.length !== totp.DIGITS ||
    !ctx.user.totpSecret ||
    ctx.user.totpSecret.startsWith(UNUSED_TOTP_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  if (!totp.validate({ secret: ctx.user.totpSecret, token: totpToken })) {
    return ctx.except(ExceptionCode.WRONG_TOTP_TOKEN);
  }

  await updateUser({
    id: ctx.user.id,
    property: UserProperty.TOTP_SECRET,
    value: ctx.user.totpSecret.replace(UNUSED_TOTP_SECRET_PREFIX, ''),
  });

  return ctx.success(null);
};
