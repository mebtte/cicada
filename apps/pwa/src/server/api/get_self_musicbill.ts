import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 * 获取自己的歌单详情
 * @author mebtte<hi@mebtte.com>
 */
async function getSelfMusicbill(id: string) {
  const musicbill = await request<{
    id: string;
    cover: string;
    name: string;
    public: 0 | 1;
    createTimestamp: number;
    musicList: {
      id: string;
      type: MusicType;
      name: string;
      aliases: string[];
      cover: string;
      asset: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
    }[];
  }>({
    path: '/api/self_musicbill',
    params: { id },
    withToken: true,
  });
  return {
    ...musicbill,
    cover: prefixServerOrigin(musicbill.cover),
  };
}

export default getSelfMusicbill;
