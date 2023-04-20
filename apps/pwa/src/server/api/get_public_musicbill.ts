import { MusicType } from '#/constants/music';
import { request } from '..';

/**
 * 获取公开乐单详情
 * @author mebtte<hi@mebtte.com>
 */
function getPublicMusicbill(id: string) {
  return request<{
    id: string;
    cover: string;
    name: string;
    createTimestamp: number;
    user: {
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

    collected: boolean;
  }>({
    path: '/api/public_musicbill',
    params: { id },
    withToken: true,
  });
}

export default getPublicMusicbill;
