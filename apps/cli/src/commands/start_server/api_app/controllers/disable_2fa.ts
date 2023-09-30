import { RequestParams } from '#/server/api/disable_2fa';
import { UNUSED_2FA_SECRET_PREFIX } from '@/constants';
import * as twoFA from '@/platform/2fa';
import { ExceptionCode } from '#/constants/exception';
import updateUser from '@/db/update_user';
import { UserProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { twoFAToken } = ctx.query as {
    [key in keyof RequestParams]?: unknown;
  };
  if (
    typeof twoFAToken !== 'string' ||
    twoFAToken.length !== twoFA.DIGITS ||
    !ctx.user.twoFASecret ||
    ctx.user.twoFASecret.startsWith(UNUSED_2FA_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  if (!twoFA.validate({ token: twoFAToken, secret: ctx.user.twoFASecret })) {
    return ctx.except(ExceptionCode.WRONG_2FA_TOKEN);
  }

  await updateUser({
    id: ctx.user.id,
    property: UserProperty.TWO_FA_SECRET,
    value: null,
  });

  return ctx.success(null);
};
