import { prefixServerOrigin } from '@/global_states/setting';
import { Response } from '#/server/api/get_exploration';
import { request } from '..';

/**
 * 获取发现内容
 * @author mebtte<hi@mebtte.com>
 */
async function getExploration() {
  const data = await request<Response>({
    path: '/api/exploration',
    withToken: true,
  });
  return {
    musicList: data.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
    })),
    singerList: data.singerList.map((s) => ({
      ...s,
      avatar: prefixServerOrigin(s.avatar),
    })),
    publicMusicbillList: data.publicMusicbillList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
    })),
  };
}

export default getExploration;
