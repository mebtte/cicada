import { EMAIL } from '#/constants/regexp';
import { ExceptionCode } from '#/constants/exception';
import { verifyLoginCode } from '@/platform/login_code';
import { sign } from '@/platform/jwt';
import { Property, getUserByEmail } from '../../platform/user';
import { Context } from '../constants/koa';

export default async (ctx: Context) => {
  const { email, loginCode }: { email?: string; loginCode?: string } =
    ctx.request.body;

  if (
    !email ||
    !EMAIL.test(email) ||
    !loginCode ||
    typeof loginCode !== 'string'
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserByEmail(email, [Property.ID]);

  /**
   * 用户不存在报参数错误
   * 避免暴露注册用户信息
   */
  if (!user) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const loginCodeVerified = await verifyLoginCode({
    userId: user.id,
    code: loginCode,
  });
  if (!loginCodeVerified) {
    return ctx.except(ExceptionCode.WRONG_LOGIN_CODE);
  }

  const token = sign(user.id);
  ctx.success(token);
};
