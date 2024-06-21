import { Method, request } from '..';

/**
 * 设用户为管理员
 * @author mebtte<i@mebtte.com>
 */
function adminUpdateUserAdmin({
  id,
  captchaId,
  captchaValue,
}: {
  id: string;
  captchaId: string;
  captchaValue: string;
}) {
  return request({
    path: '/api/admin/user_admin',
    method: Method.PUT,
    body: {
      id,
      captchaId,
      captchaValue,
    },
    withToken: true,
  });
}

export default adminUpdateUserAdmin;
