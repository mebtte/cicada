import { Response } from '#/server/api/get_shared_musicbill_invitation_list';
import { request } from '..';

/**
 * 获取共享乐单邀请列表
 * @author mebtte<hi@mebtte.com>
 */
function getSharedMusicbillInvitationList() {
  return request<Response>({
    path: '/api/shared_musicbill_invitation_list',
    withToken: true,
  });
}

export default getSharedMusicbillInvitationList;
