import { MusicType } from '#/constants/music';
import { request } from '.';

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
      sq: string;
      hq: string;
      ac: string;
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
