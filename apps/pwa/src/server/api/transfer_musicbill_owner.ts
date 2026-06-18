import { Method, request } from '..';

/**
 * 转让乐单所有者
 * 仅允许将所有权转让给已接受邀请的共享用户; 旧 owner 自动成为已接受的共享用户.
 * @author mebtte<i@mebtte.com>
 */
function transferMusicbillOwner({
  musicbillId,
  userId,
  captchaId,
  captchaValue,
}: {
  musicbillId: string;
  userId: string;
  captchaId: string;
  captchaValue: string;
}) {
  return request({
    path: '/api/common/musicbill/owner',
    method: Method.PUT,
    withToken: true,
    body: { musicbillId, userId, captchaId, captchaValue },
  });
}

export default transferMusicbillOwner;
