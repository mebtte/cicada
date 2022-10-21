import { MusicType } from '#/constants/music';
import { request } from '.';

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
      sq: string;
      hq: string;
      ac: string;
      singers: {
        id: string;
        avatar: string;
        name: string;
        aliases: string[];
      }[];
      createUser: {
        id: string;
        nickname: string;
        avatar: string;
      };
    }[];
  }>({
    path: '/api/music/search',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default searchMusic;
