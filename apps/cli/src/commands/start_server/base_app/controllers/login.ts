import { ExceptionCode } from '#/constants/exception';
import { sign } from '@/platform/jwt';
import { getUserByUsername } from '@/db/user';
import { UserProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { username, loginCode } = ctx.request.body as {
    username?: unknown;
    loginCode?: unknown;
  };

  if (
    typeof username !== 'string' ||
    !username.length ||
    typeof loginCode !== 'string' ||
    !loginCode.length
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserByUsername(username, [UserProperty.ID]);

  /**
   * 用户不存在报参数错误
   * 避免暴露注册用户信息
   */
  if (!user) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  /**
   * @todo refactor login
   * @author mebtte<hi@mebtte.com>
   */

  const token = sign(user.id);
  ctx.success(token);
};
