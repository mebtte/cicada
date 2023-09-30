import { UNUSED_2FA_SECRET_PREFIX } from '@/constants';
import { ExceptionCode } from '#/constants/exception';
import * as twoFA from '@/platform/2fa';
import updateUser from '@/db/update_user';
import { UserProperty } from '@/constants/db_definition';
import { Response } from '#/server/api/create_2fa';
import { Context } from '../constants';

export default async (ctx: Context) => {
  if (
    ctx.user.twoFASecret &&
    !ctx.user.twoFASecret.startsWith(UNUSED_2FA_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.TWO_FA_ENABLED_ALREADY);
  }

  const secret = twoFA.createSecret();
  await updateUser({
    id: ctx.user.id,
    property: UserProperty.TWO_FA_SECRET,
    value: `${UNUSED_2FA_SECRET_PREFIX}${secret}`,
  });
  return ctx.success<Response>(
    twoFA.create({
      language: ctx.language,
      username: ctx.user.username,
      secret,
    }),
  );
};
