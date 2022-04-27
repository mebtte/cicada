/* eslint-disable camelcase */
import { MusicType } from '@/constants/music';
import server from '.';

/**
 * 获取歌手详情
 * @author mebtte<hi@mebtte.com>
 */
function getSingerDetail(id: string) {
  return server.get<{
    id: string;
    avatar: string;
    name: string;
    alias: string;
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
  }>('/api/get_singer_detail', {
    withToken: true,
    params: { id },
  });
}

export default getSingerDetail;
