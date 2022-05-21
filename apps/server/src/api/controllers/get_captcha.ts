import captcha from 'svg-captcha';
import shortid from 'shortid';
import { saveCaptcha } from '@/platform/captcha';
import { Context } from '../constants/koa';

export default async (ctx: Context) => {
  const captchaData = captcha.create({
    size: 5,
    ignoreChars: '0o1il',
    noise: 2,
  });
  const id = shortid.generate();
  await saveCaptcha({ id, value: captchaData.text });
  ctx.success({ id, svg: captchaData.data });
};
