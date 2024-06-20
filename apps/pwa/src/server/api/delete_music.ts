import { Method, request } from '..';

/**
 * 删除音乐
 * @author mebtte<i@mebtte.com>
 */
function deleteMusic({
  id,
  captchaId,
  captchaValue,
}: {
  id: string;
  captchaId: string;
  captchaValue: string;
}) {
  return request({
    path: '/api/music',
    method: Method.DELETE,
    params: { id, captchaId, captchaValue },
    withToken: true,
  });
}

export default deleteMusic;
