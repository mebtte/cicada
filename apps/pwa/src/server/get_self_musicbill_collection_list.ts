import { request } from '.';

function getSelfMusicbillCollectionList({
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
      user: { id: string; nickname: string; avatar: string };
      collectTimestamp: number;
    }[];
  }>({
    path: '/api/self_musicbill_collection_list',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default getSelfMusicbillCollectionList;
