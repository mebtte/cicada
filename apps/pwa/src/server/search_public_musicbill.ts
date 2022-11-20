import { request } from '.';

function searchPublicMusicbill({
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
    musicbillList: {
      id: string;
      name: string;
      cover: string;
      musicCount: number;
      user: {
        id: string;
        nickname: string;
        avatar: string;
      };
    }[];
  }>({
    path: '/api/public_musicbill/search',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default searchPublicMusicbill;
