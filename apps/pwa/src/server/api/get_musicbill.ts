import { Response } from '#/server/api/get_musicbill';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

/**
 * 获取乐单
 * @author mebtte<hi@mebtte.com>
 */
async function getMusicbill(id: string) {
  const musicbill = await request<Response>({
    path: '/api/musicbill',
    params: { id },
    withToken: true,
  });
  return {
    ...musicbill,
    cover: prefixServerOrigin(musicbill.cover),
    owner: {
      ...musicbill.owner,
      avatar: prefixServerOrigin(musicbill.owner.avatar),
    },
    sharedUserList: musicbill.sharedUserList.map((u) => ({
      ...u,
      avatar: prefixServerOrigin(u.avatar),
    })),
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getMusicbill;
