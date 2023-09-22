import { Method, request } from '..';

/**
 * 乐单添加共享用户
 * @author mebtte<hi@mebtte.com>
 */
function addMusicbillSharedUser({
  musicbillId,
  username,
}: {
  musicbillId: string;
  username: string;
}) {
  return request<void>({
    path: '/api/musicbill/shared_user',
    method: Method.POST,
    withToken: true,
    body: { musicbillId, username },
  });
}

export default addMusicbillSharedUser;
