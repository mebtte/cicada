import captcha from 'svg-captcha';
import shortid from 'shortid';
import db from '@/platform/db';
import { Context } from '../constants/koa';

export default async (ctx: Context) => {
  const captchaData = captcha.create({
    size: 5,
    ignoreChars: '0o1il',
    noise: 2,
  });
  const id = shortid.generate();
  await new Promise<void>((resolve, reject) =>
    db.run(
      'insert into captcha(id, value, createTimestamp) values(?, ?, ?)',
      [id, captchaData.text, Date.now()],
      (_, error) => (error ? reject(error) : resolve()),
    ),
  );
  ctx.success({ id, svg: captchaData.data });
};
