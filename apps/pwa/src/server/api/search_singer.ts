import { Response } from '#/server/api/search_singer';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function searchSinger({
  keyword,
  page,
  pageSize,
  requestMinimalDuration,
}: {
  keyword: string;
  page: number;
  pageSize: number;
  requestMinimalDuration?: number;
}) {
  const data = await request<Response>({
    path: '/api/singer/search',
    params: { keyword, page, pageSize },
    withToken: true,
    requestMinimalDuration,
  });
  return {
    ...data,
    singerList: data.singerList.map((s) => ({
      ...s,
      avatar: prefixServerOrigin(s.avatar),
    })),
  };
}

export default searchSinger;
