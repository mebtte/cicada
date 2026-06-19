import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type Response = {
  total: number;
  collectionList: {
    id: string;
    name: string;
    cover: string;
    musicCount: number;
    user: { id: string; nickname: string };
  }[];
};

type RawResponse = {
  total: number;
  collectionList: (Omit<Response['collectionList'][number], 'musicCount'> & {
    musicCount?: number;
  })[];
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
  const data = await request<RawResponse>({
    path: '/api/common/public_musicbill_collection_list',
    params: { keyword, page, pageSize },
    withToken: true,
  });
  return {
    ...data,
    collectionList: data.collectionList.map((mb) => ({
      ...mb,
      musicCount: mb.musicCount ?? 0,
      cover: prefixServerOrigin(mb.cover),
    })),
  };
}

export default getSelfMusicbillCollectionList;
