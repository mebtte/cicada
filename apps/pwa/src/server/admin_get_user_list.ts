import { request } from '.';

function adminGetUserList() {
  return request<
    {
      id: string;
      nickname: string;
      avatar?: string;
      admin: 0 | 1;
      email: string;
      remark: string;
      joinTimestamp: number;
    }[]
  >({
    path: '/api/admin/user_list',
    withToken: true,
  });
}

export default adminGetUserList;
