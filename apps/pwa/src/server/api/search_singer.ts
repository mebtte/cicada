import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type SingerPhoto = {
  id: string;
  asset: string;
  description: string;
};

type Response = {
  total: number;
  singerList: {
    id: string;
    name: string;
    aliases: string[];
    photos: SingerPhoto[];
  }[];
};

type RawResponse = {
  total: number;
  singerList: (Omit<Response['singerList'][number], 'photos'> & {
    photos?: SingerPhoto[];
  })[];
};

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
  const data = await request<RawResponse>({
    path: '/api/singer/search',
    params: { keyword, page, pageSize },
    withToken: true,
    requestMinimalDuration,
  });
  return {
    ...data,
    singerList: data.singerList.map((s) => ({
      ...s,
      photos: (s.photos ?? []).map((p) => ({
        ...p,
        asset: prefixServerOrigin(p.asset),
      })),
    })),
  };
}

export default searchSinger;
