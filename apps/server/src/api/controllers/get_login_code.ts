import { EMAIL } from '#/constants/regexp';
import { ExceptionCode } from '#/constants/exception';
import * as db from '@/db';
import { verifyCaptcha } from '@/platform/captcha';
import {
  hasLoginCodeInGetInterval,
  saveLoginCode,
} from '@/platform/login_code';
import generateRandomInteger from '#/utils/generate_random_integer';
import { sendMail } from '@/platform/email';
import { LOGIN_CODE_TTL } from '../../constants';
import { Context } from '../constants/koa';

export default async (ctx: Context) => {
  const { email, captchaId, captchaValue } = ctx.query as {
    email?: string;
    captchaId?: string;
    captchaValue?: string;
  };

  if (!email || !EMAIL.test(email) || !captchaId || !captchaValue) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const captchaVerified = await verifyCaptcha({
    id: captchaId,
    value: captchaValue,
  });
  if (!captchaVerified) {
    return ctx.except(ExceptionCode.CAPTCHA_ERROR);
  }

  /**
   * 用户不存在返回参数错误
   * 避免暴露注册用户邮箱
   */
  const user = await db.get<{ id: string; nickname: string }>(
    'select id, nickname from user where email = ?',
    [email],
  );
  if (!user) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const hasLoginCodeAlready = await hasLoginCodeInGetInterval({
    userId: user.id,
  });
  if (hasLoginCodeAlready) {
    return ctx.except(ExceptionCode.HAS_LOGIN_CODE_ALREADY);
  }

  const code = generateRandomInteger(100000, 1000000).toString();

  await sendMail({
    to: email,
    title: '「知了」登录验证码',
    html: `Hi, 「${
      user.nickname
    }」,<br><br>你刚刚尝试登录, 本次登录验证码是「<code>${code}</code>」, ${
      LOGIN_CODE_TTL / 1000 / 60
    } 分钟内有效.`,
  });

  await saveLoginCode({ userId: user.id, code });

  ctx.success();
};
