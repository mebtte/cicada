import { Response } from '#/server/api/search_music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

async function searchMusic({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  const result = await request<Response>({
    path: '/api/music/search',
    params: { keyword, page, pageSize },
    withToken: true,
  });
  return {
    ...result,
    musicList: result.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default searchMusic;
