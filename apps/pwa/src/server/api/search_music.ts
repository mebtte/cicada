import { MusicType } from '#/constants/music';
import { request } from '..';

function searchMusic({
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
      asset: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
    }[];
  }>({
    path: '/api/music/search',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default searchMusic;
