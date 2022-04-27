/* eslint-disable camelcase */
import { MusicType } from '@/constants/music';
import server from '.';

/**
 * 获取公开歌单详情
 * @author mebtte<hi@mebtte.com>
 */
function getPublicMusicbillDetail(id: string) {
  return server.get<{
    id: string;
    cover: string;
    name: string;
    description: string;
    user: {
      id: string;
      nickname: string;
      condition: string;
      avatar: string;
    };
    music_list: {
      id: string;
      cover: string;
      name: string;
      type: MusicType;
      alias: string;
      ac: string;
      hq: string;
      mv_link: string;
      sq: string;
      singers: {
        id: string;
        name: string;
        avatar: string;
        alias: string;
      }[];
      fork?: string[];
      fork_from?: string[];
    }[];
  }>('/api/get_public_musicbill_detail', {
    withToken: true,
    params: { id },
  });
}

export default getPublicMusicbillDetail;
