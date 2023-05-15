import { request } from '..';

function getLyricList({
  musicId,
  minRequestDuration = 1000,
}: {
  musicId: string;
  minRequestDuration?: number;
}) {
  return request<
    {
      id: number;
      lrc: string;
    }[]
  >({
    path: '/api/lyric_list',
    params: { musicId },
    withToken: true,
    minRequestDuration,
  });
}

export default getLyricList;
