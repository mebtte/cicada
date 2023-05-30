import { Response } from '#/server/api/get_self_musicbill';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 * 获取自己的歌单详情
 * @author mebtte<hi@mebtte.com>
 */
async function getSelfMusicbill(id: string) {
  const musicbill = await request<Response>({
    path: '/api/self_musicbill',
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
  };
}

export default getSelfMusicbill;
