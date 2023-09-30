import { RequestBody } from '#/server/api/enable_2fa';
import * as twoFA from '@/platform/2fa';
import { ExceptionCode } from '#/constants/exception';
import { TOKEN_IDENTIFIER_LENGTH, UNUSED_2FA_SECRET_PREFIX } from '@/constants';
import updateUser from '@/db/update_user';
import { UserProperty } from '@/constants/db_definition';
import generateRandomString from '#/utils/generate_random_string';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { twoFAToken } = ctx.request.body as {
    [key in keyof RequestBody]?: unknown;
  };
  if (
    typeof twoFAToken !== 'string' ||
    twoFAToken.length !== twoFA.DIGITS ||
    !ctx.user.twoFASecret ||
    !ctx.user.twoFASecret.startsWith(UNUSED_2FA_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  if (
    !twoFA.validate({
      secret: ctx.user.twoFASecret.replace(UNUSED_2FA_SECRET_PREFIX, ''),
      token: twoFAToken,
    })
  ) {
    return ctx.except(ExceptionCode.WRONG_2FA_TOKEN);
  }

  await Promise.all([
    updateUser({
      id: ctx.user.id,
      property: UserProperty.TWO_FA_SECRET,
      value: ctx.user.twoFASecret.replace(UNUSED_2FA_SECRET_PREFIX, ''),
    }),
    updateUser({
      id: ctx.user.id,
      property: UserProperty.TOKEN_IDENTIFIER,
      value: generateRandomString(TOKEN_IDENTIFIER_LENGTH),
    }),
  ]);

  return ctx.success(null);
};
