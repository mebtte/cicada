import { MusicType } from '#/constants/music';
import { request } from '..';

/**
 * 获取歌手详情
 * @author mebtte<hi@mebtte.com>
 */
function getSingerDetail(id: string) {
  return request<{
    id: string;
    avatar: string;
    name: string;
    aliases: string[];
    createTimestamp: number;
    createUser: {
      id: string;
      nickname: string;
      avatar: string;
    };
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
    path: '/api/singer_detail',
    params: { id },
    withToken: true,
  });
}

export default getSingerDetail;
