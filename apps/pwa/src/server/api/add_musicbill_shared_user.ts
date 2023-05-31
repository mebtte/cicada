import { Method, request } from '..';

/**
 * 乐单添加共享用户
 * @author mebtte<hi@mebtte.com>
 */
function addMusicbillSharedUser({
  musicbillId,
  email,
}: {
  musicbillId: string;
  email: string;
}) {
  return request({
    path: '/api/musicbill/shared_user',
    method: Method.POST,
    withToken: true,
    body: { musicbillId, email },
  });
}

export default addMusicbillSharedUser;
