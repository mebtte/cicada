import captcha from 'svg-captcha';
import shortid from 'shortid';
import cache, { Key } from '@/platform/cache';
import { CAPTCHA_TTL } from '#/constants';
import { Context } from '../constants/koa';

export default async (ctx: Context) => {
  const captchaData = captcha.create({
    size: 4,
    ignoreChars: '0o1i',
    noise: 2,
  });
  const id = shortid.generate();
  cache.set({
    key: Key.CAPTCHA,
    value: captchaData.text,
    ttl: CAPTCHA_TTL,
    keyReplace: (key) => key.replace('{{id}}', id),
  });
  ctx.success({ id, svg: captchaData.data });
};
