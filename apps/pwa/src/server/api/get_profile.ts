import { prefixServerOrigin } from '@/global_states/server';
import { HEADER_TOKEN } from '@/constants/api';
import { request } from '..';

interface Response {
  id: string;
  username: string;
  avatar: string;
  nickname: string;
  joinTimestamp: number;
  admin: 0 | 1;
  musicbillOrdersJSON?: string | null;
  lastActiveTimestamp: number;
  twoFAEnabled: boolean;
}

async function getProfile(token?: string) {
  const profile = await request<Response>({
    path: '/api/profile',
    headers: token
      ? {
          [HEADER_TOKEN]: token,
        }
      : undefined,
    withToken: !token,
  });
  return {
    ...profile,
    avatar: prefixServerOrigin(profile.avatar),
  };
}

export default getProfile;
