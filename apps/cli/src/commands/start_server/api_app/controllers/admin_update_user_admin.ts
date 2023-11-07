import { ExceptionCode } from '#/constants/exception';
import * as captcha from '@/platform/captcha';
import { getUserById } from '@/db/user';
import { UserProperty } from '@/constants/db_definition';
import updateUser from '@/db/update_user';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id, captchaId, captchaValue } = ctx.request.body as {
    id?: unknown;
    captchaId?: string;
    captchaValue?: string;
  };

  if (
    typeof id !== 'string' ||
    !id.length ||
    typeof captchaId !== 'string' ||
    !captchaId.length ||
    typeof captchaValue !== 'string' ||
    !captchaValue.length
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const captchaVerified = await captcha.verify({
    id: captchaId,
    value: captchaValue,
  });
  if (!captchaVerified) {
    return ctx.except(ExceptionCode.WRONG_CAPTCHA);
  }

  const user = await getUserById(id, [UserProperty.ID, UserProperty.ADMIN]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXISTED);
  }
  if (user.admin) {
    return ctx.except(ExceptionCode.USER_IS_ADMIN_ALREADY);
  }

  await updateUser({ id, property: UserProperty.ADMIN, value: 1 });
  return ctx.success(null);
};
