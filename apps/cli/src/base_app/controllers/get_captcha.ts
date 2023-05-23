import { createCaptcha } from '@/platform/captcha';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const captchaData = await createCaptcha();
  return ctx.success(captchaData);
};
