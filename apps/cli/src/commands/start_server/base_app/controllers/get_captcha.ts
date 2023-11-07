import * as captcha from '@/platform/captcha';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const captchaData = await captcha.create();
  return ctx.success(captchaData);
};
