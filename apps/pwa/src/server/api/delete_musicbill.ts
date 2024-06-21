import { request, Method } from '..';

/**
 * 删除乐单
 * @author mebtte<i@mebtte.com>
 */
function deleteMusicbill({
  id,
  captchaId,
  captchaValue,
}: {
  id: string;
  captchaId: string;
  captchaValue: string;
}) {
  return request({
    method: Method.DELETE,
    path: '/api/musicbill',
    params: { id, captchaId, captchaValue },
    withToken: true,
  });
}

export default deleteMusicbill;
