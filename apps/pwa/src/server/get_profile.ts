import { request } from '.';

function getProfile() {
  return request<{
    id: string;
    email: string;
    avatar: string;
    nickname: string;
    joinTimestamp: number;
    admin: 0 | 1;
    remark: string;
  }>({
    path: '/api/profile',
    withToken: true,
  });
}

export default getProfile;
