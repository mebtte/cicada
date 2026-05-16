import { Method, request } from '..';

/**
 * 更新用户管理员角色
 * @author mebtte<i@mebtte.com>
 */
function adminUpdateUserAdmin({
  id,
  admin,
  captchaId,
  captchaValue,
}: {
  id: string;
  admin: boolean | 0 | 1;
  captchaId?: string;
  captchaValue?: string;
}) {
  return request({
    path: '/api/admin/user_admin',
    method: Method.PUT,
    body: {
      id,
      admin: admin === true || admin === 1 ? 1 : 0,
      captchaId,
      captchaValue,
    },
    withToken: true,
  });
}

export default adminUpdateUserAdmin;
