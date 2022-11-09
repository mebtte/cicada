import { request } from '.';

function getLyric({
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
    path: '/api/lyric',
    params: { musicId },
    withToken: true,
    minDuration,
  });
}

export default getLyric;
