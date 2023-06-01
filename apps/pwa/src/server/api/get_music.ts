import { Response } from '#/server/api/get_music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 * 获取音乐详情
 * @author mebtte<hi@mebtte.com>
 */
async function getMusic(id: string) {
  const music = await request<Response>({
    path: '/api/music',
    params: { id },
    withToken: true,
  });
  return {
    ...music,
    cover: prefixServerOrigin(music.cover),
    asset: prefixServerOrigin(music.asset),
    singers: music.singers.map((s) => ({
      ...s,
      avatar: prefixServerOrigin(s.avatar),
    })),
    forkList: music.forkList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
    })),
    forkFromList: music.forkFromList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
    })),
  };
}

export default getMusic;
