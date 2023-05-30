import SearchMusic from '#/server/api/search_music';
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
  return request<SearchMusic>({
    path: '/api/music/search',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default searchMusic;
