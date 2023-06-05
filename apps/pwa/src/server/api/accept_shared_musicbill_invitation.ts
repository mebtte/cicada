import { Method, request } from '..';

/**
 * 接受共享乐单邀请
 * @author mebtte<hi@mebtte.com>
 */
function acceptSharedMusicbillInvitation(id: number) {
  return request<void>({
    path: '/api/shared_musicbill_invitation',
    withToken: true,
    body: { id },
    method: Method.PUT,
  });
}

export default acceptSharedMusicbillInvitation;
