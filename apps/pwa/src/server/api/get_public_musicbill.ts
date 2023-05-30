import GetPublicMusicbill from '#/server/api/get_public_musicbill';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 * 获取公开乐单详情
 * @author mebtte<hi@mebtte.com>
 */
async function getPublicMusicbill(id: string) {
  const musicbill = await request<GetPublicMusicbill>({
    path: '/api/public_musicbill',
    params: { id },
    withToken: true,
  });
  return {
    ...musicbill,
    cover: prefixServerOrigin(musicbill.cover),
    musicList: musicbill.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
    user: {
      ...musicbill.user,
      avatar: prefixServerOrigin(musicbill.user.avatar),
    },
  };
}

export default getPublicMusicbill;
