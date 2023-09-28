import { UNUSED_TOTP_SECRET_PREFIX } from '@/constants';
import { ExceptionCode } from '#/constants/exception';
import generateRandomString from '#/utils/generate_random_string';
import * as totp from '@/platform/totp';
import updateUser from '@/db/update_user';
import { UserProperty } from '@/constants/db_definition';
import { Response } from '#/server/api/create_totp';
import { Context } from '../constants';

export default async (ctx: Context) => {
  if (
    ctx.user.totpSecret &&
    !ctx.user.totpSecret.startsWith(UNUSED_TOTP_SECRET_PREFIX)
  ) {
    return ctx.except(ExceptionCode.TOTP_ENABLED_ALREADY);
  }

  const secret = generateRandomString(12);
  await updateUser({
    id: ctx.user.id,
    property: UserProperty.TOTP_SECRET,
    value: `${UNUSED_TOTP_SECRET_PREFIX}${secret}`,
  });
  return ctx.success<Response>(
    totp.create({
      language: ctx.language,
      username: ctx.user.username,
      secret,
    }),
  );
};
