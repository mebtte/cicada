/* eslint-disable camelcase */
import { MusicType } from '@/constants/music';
import api from '.';

/**
 * 获取推荐音乐列表
 * @author mebtte<hi@mebtte.com>
 */
function getRecommendatoryMusicList() {
  return api.get<
    {
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
    }[]
  >('/api/get_recommendatory_music_list', {
    withToken: true,
  });
}

export default getRecommendatoryMusicList;
