import { Response } from '#/server/api/search_public_musicbill';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

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
