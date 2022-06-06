import day from '#/utils/day';
import { ExceptionCode } from '#/constants/exception';
import { EMAIL } from '#/constants/regexp';
import * as db from '@/db';
import generateRandomInteger from '#/utils/generate_random_integer';
import { REMARK_MAX_LENGTH } from '#/constants/user';
import { sendMail } from '@/platform/email';
import argv from '@/argv';
import { Property, getUserByEmail } from '@/db/user';
import { Context } from '../constants/koa';

const generateEmailHtml = () => `Hi,
<br>
<br>
已成功为您创建账号, 现在可以使用当前邮箱登录到「<a href="${
  argv.publicAddress
}">知了</a>」.
<br>
如果使用中有任何问题或者建议, 可以通过 <a href="https://github.com/mebtte/cicada">Issue</a> 进行反馈.
<br>
<br>
知了 ${day(new Date()).format('YYYY-MM-DD HH:mm')}`;

export default async (ctx: Context) => {
  const {
    email,
    remark = '',
    super: isSuper,
  } = ctx.request.body as {
    email?: string;
    remark?: string;
    super?: 0 | 1;
  };

  if (
    typeof email !== 'string' ||
    !EMAIL.test(email) ||
    typeof remark !== 'string' ||
    remark.length > REMARK_MAX_LENGTH ||
    (isSuper !== 0 && isSuper !== 1)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserByEmail(email, [Property.ID]);
  if (user) {
    return ctx.except(ExceptionCode.EMAIL_EXISTED);
  }

  await sendMail({
    to: email,
    title: '欢迎使用知了',
    html: generateEmailHtml(),
  });

  const id = generateRandomInteger(1_0000_0000, 10_0000_0000).toString();
  await db.run(
    `
      insert into user(id, email, nickname, joinTimestamp, remark, super)
        values(?, ?, ?, ?, ?, ?)
    `,
    [id, email, id, Date.now(), remark, isSuper],
  );

  return ctx.success();
};
