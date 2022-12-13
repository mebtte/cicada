import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '.';

async function getProfile() {
  const profile = await request<{
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
  return {
    ...profile,
    avatar: prefixServerOrigin(profile.avatar),
  };
}

export default getProfile;
