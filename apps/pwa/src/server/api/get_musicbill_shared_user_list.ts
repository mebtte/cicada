import { Response } from '#/server/api/get_musicbill_shared_user_list';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 *
 * @author mebtte<hi@mebtte.com>
 */
async function getMusicbillSharedUserList(id: string) {
  const data = await request<Response>({
    path: '/api/musicbill/shared_user_list',
    params: { id },
    withToken: true,
  });
  return data.map((u) => ({
    ...u,
    avatar: prefixServerOrigin(u.avatar),
  }));
}

export default getMusicbillSharedUserList;
