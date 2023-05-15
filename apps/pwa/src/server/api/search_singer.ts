import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function searchSinger({
  keyword,
  page,
  pageSize,
  minRequestDuration,
}: {
  keyword: string;
  page: number;
  pageSize: number;
  minRequestDuration?: number;
}) {
  const data = await request<{
    total: number;
    singerList: {
      id: string;
      avatar: string;
      name: string;
      aliases: string[];
      musicCount: number;
    }[];
  }>({
    path: '/api/singer/search',
    params: { keyword, page, pageSize },
    withToken: true,
    minRequestDuration,
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
