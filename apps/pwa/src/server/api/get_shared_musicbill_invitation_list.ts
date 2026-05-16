import { request } from '..';

type Response = {
  id: number;
  inviteTimestamp: number;
  inviteUserId: string;
  inviteUserNickname: string;
  musicbillId: string;
  musicbillName: string;
}[];

/**
 * 获取共享乐单邀请列表
 * @author mebtte<i@mebtte.com>
 */
function getSharedMusicbillInvitationList() {
  return request<Response>({
    path: '/api/shared_musicbill_invitation_list',
    withToken: true,
  });
}

export default getSharedMusicbillInvitationList;
