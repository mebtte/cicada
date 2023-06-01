import { prefixServerOrigin } from '@/global_states/setting';
import { Response } from '#/server/api/get_profile';
import { request } from '..';

async function getProfile() {
  const profile = await request<Response>({
    path: '/api/profile',
    withToken: true,
  });
  return {
    ...profile,
    avatar: prefixServerOrigin(profile.avatar),
  };
}

export default getProfile;
