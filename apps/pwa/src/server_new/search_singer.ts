import { request } from '.';

function searchSinger({
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
    singerList: {
      id: string;
      avatar: string;
      name: string;
      aliases: string;
      createUser: {
        id: string;
        avatar: string;
        nickname: string;
      };
    }[];
  }>({
    path: '/api/singer/search',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default searchSinger;
