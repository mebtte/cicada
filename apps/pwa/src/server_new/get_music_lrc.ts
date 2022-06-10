import { request } from '.';

function getMusicLrc(musicId: string) {
  return request<{ lrc: string }>({
    path: '/api/music_lrc',
    params: { musicId },
    withToken: true,
  });
}

export default getMusicLrc;
