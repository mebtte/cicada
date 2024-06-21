import { Method, request } from '..';

/**
 * 删除乐单共享用户
 * @author mebtte<i@mebtte.com>
 */
function deleteMusicbillSharedUser({
  musicbillId,
  userId,
}: {
  musicbillId: string;
  userId: string;
}) {
  return request({
    path: '/api/musicbill/shared_user',
    withToken: true,
    params: { musicbillId, userId },
    method: Method.DELETE,
  });
}

export default deleteMusicbillSharedUser;
