import { prefixServerOrigin } from '@/global_states/setting';
import { Response } from '#/server/api/get_user';
import { request } from '..';

/**
 * 获取用户详情
 * @author mebtte<hi@mebtte.com>
 */
async function getUser(id: string) {
  const user = await request<Response>({
    path: '/api/user',
    params: { id },
    withToken: true,
  });
  return {
    ...user,
    avatar: prefixServerOrigin(user.avatar),
    musicbillList: user.musicbillList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
    })),
    musicList: user.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getUser;
