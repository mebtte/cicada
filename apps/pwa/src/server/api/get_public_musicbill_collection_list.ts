import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type Response = {
  total: number;
  collectionList: {
    id: string;
    name: string;
    cover: string;
    user: { id: string; nickname: string };
  }[];
};

async function getSelfMusicbillCollectionList({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  const data = await request<Response>({
    path: '/api/public_musicbill_collection_list',
    params: { keyword, page, pageSize },
    withToken: true,
  });
  return {
    ...data,
    collectionList: data.collectionList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
    })),
  };
}

export default getSelfMusicbillCollectionList;
