import { request } from '.';

function getLyric(musicId: string) {
  return request<string>({
    path: '/api/lyric',
    params: { musicId },
    withToken: true,
  });
}

export default getLyric;
