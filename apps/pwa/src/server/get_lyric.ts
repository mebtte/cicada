import { request } from '.';

function getLyric(musicId: string) {
  return request<
    {
      id: number;
      content: string;
    }[]
  >({
    path: '/api/lyric',
    params: { musicId },
    withToken: true,
  });
}

export default getLyric;
