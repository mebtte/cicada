import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '.';

async function adminGetUserList() {
  const userList = await request<
    {
      id: string;
      nickname: string;
      avatar: string;
      admin: 0 | 1;
      email: string;
      remark: string;
      joinTimestamp: number;
      musicbillMaxAmount: number;
      createMusicMaxAmountPerDay: number;
      exportMusicbillMaxTimePerDay: number;
    }[]
  >({
    path: '/api/admin/user_list',
    withToken: true,
  });
  return userList.map((u) => ({
    ...u,
    avatar: prefixServerOrigin(u.avatar),
  }));
}

export default adminGetUserList;
