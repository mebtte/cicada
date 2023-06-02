import { prefixServerOrigin } from '@/global_states/setting';
import { Response } from '#/server/api/get_public_musicbill_collection_list';
import { request } from '..';

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
    musicbillList: data.musicbillList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
      user: {
        ...mb.user,
        avatar: prefixServerOrigin(mb.user.avatar),
      },
    })),
  };
}

export default getSelfMusicbillCollectionList;
