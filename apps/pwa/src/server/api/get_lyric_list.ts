import { request } from '..';

function getLyricList({ musicId }: { musicId: string }) {
  return request<
    {
      id: number;
      lrc: string;
    }[]
  >({
    path: '/api/lyric_list',
    params: { musicId },
    withToken: true,
  });
}

export default getLyricList;
