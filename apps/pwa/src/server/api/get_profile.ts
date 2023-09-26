import { prefixServerOrigin } from '@/global_states/server';
import { Response } from '#/server/api/get_profile';
import { request } from '..';

async function getProfile(token?: string) {
  const profile = await request<Response>({
    path: '/api/profile',
    headers: token
      ? {
          authorization: token,
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
