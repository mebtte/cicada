import { Response } from '#/server/api/admin_get_user_list';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

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
