import { Method, request } from '..';

/**
 * 删除用户
 * @author mebtte<hi@mebtte.com>
 */
function adminDeleteUser({
  id,
  captchaId,
  captchaValue,
}: {
  id: string;
  captchaId: string;
  captchaValue: string;
}) {
  return request({
    path: '/api/admin/user',
    method: Method.DELETE,
    params: { id, captchaId, captchaValue },
    withToken: true,
    timeout: 1000 * 60,
  });
}

export default adminDeleteUser;
