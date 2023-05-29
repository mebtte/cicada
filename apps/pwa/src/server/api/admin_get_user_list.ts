import AdminGetUserList from '#/response_data/api/admin_get_user_list';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function adminGetUserList() {
  const userList = await request<AdminGetUserList>({
    path: '/api/admin/user_list',
    withToken: true,
  });
  return userList.map((u) => ({
    ...u,
    avatar: prefixServerOrigin(u.avatar),
  }));
}

export default adminGetUserList;
