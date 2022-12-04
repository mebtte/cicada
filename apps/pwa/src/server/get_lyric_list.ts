import { request } from '.';

function getLyricList({
  musicId,
  minDuration = 1000,
}: {
  musicId: string;
  minDuration?: number;
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
    minDuration,
  });
}

export default getLyricList;
