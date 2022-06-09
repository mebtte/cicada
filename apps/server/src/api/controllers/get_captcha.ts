import captcha from 'svg-captcha';
import { saveCaptcha } from '@/platform/captcha';
import generateRandomString from '#/utils/generate_random_string';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const captchaData = captcha.create({
    size: 5,
    ignoreChars: '01oOiIlL',
    noise: 4,
  });
  const id = generateRandomString(8, false);
  await saveCaptcha({ id, value: captchaData.text });
  ctx.success({ id, svg: captchaData.data });
};
