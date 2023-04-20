import { MusicType } from '#/constants/music';
import { request } from '..';

/**
 * 获取自己的歌单详情
 * @author mebtte<hi@mebtte.com>
 */
function getSelfMusicbill(id: string) {
  return request<{
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
}

export default getSelfMusicbill;
