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
      type: MusicType;
      name: string;
      aliases: string[];
      cover: string;
      sq: string;
      hq: string;
      ac: string;
      singers: {
        id: string;
        avatar: string;
        name: string;
        aliases: string[];
      }[];
    }[];
  }>({
    path: '/api/self_music_list',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default getSelfMusicList;
