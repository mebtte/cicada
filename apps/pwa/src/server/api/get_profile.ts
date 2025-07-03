import { prefixServerOrigin } from '@/global_states/server';
import { Response } from '#/server/api/get_profile';
import { request } from '..';
import { HEADER_TOKEN } from '#/constants';

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
