import { MusicType } from '#/constants/music';
import { request } from '..';

/**
 * 获取自己的音乐列表
 * @author mebtte<hi@mebtte.com>
 */
function getSelfMusicList({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  return request<{
    total: number;
    musicList: {
      id: string;
      cover: string;
      type: MusicType;
      name: string;
      aliases: string[];
      heat: number;
      asset: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
      createTimestamp: number;
    }[];
  }>({
    path: '/api/self_music_list',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default getSelfMusicList;
