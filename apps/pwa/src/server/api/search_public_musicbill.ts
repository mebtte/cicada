import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type Response = {
  total: number;
  musicbillList: {
    id: string;
    name: string;
    cover: string;
    musicCount: number;
    collectionCount: number;
    user: {
      id: string;
      nickname: string;
      avatar: string;
    };
  }[];
};

async function searchPublicMusicbill({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  const data = await request<Response>({
    path: '/api/public_musicbill/search',
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

export default searchPublicMusicbill;
