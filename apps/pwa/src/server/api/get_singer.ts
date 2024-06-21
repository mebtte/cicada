import { Response } from '#/server/api/get_singer';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

/**
 * 获取歌手详情
 * @author mebtte<i@mebtte.com>
 */
async function getSinger(id: string) {
  const singer = await request<Response>({
    path: '/api/singer',
    params: { id },
    withToken: true,
  });
  return {
    ...singer,
    avatar: prefixServerOrigin(singer.avatar),
    musicList: singer.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getSinger;
