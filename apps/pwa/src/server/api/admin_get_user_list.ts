import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type Response = {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  admin: 0 | 1;
  remark: string;
  joinTimestamp: number;
  lastActiveTimestamp: number;
  twoFAEnabled: boolean;
}[];

async function adminGetUserList() {
  const userList = await request<Response>({
    path: '/api/admin/user_list',
    withToken: true,
  });
  return userList.map((u) => ({
    ...u,
    avatar: prefixServerOrigin(u.avatar),
  }));
}

export default adminGetUserList;
