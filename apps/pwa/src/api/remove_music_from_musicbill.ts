import { request, Method } from '.';

function removeMusicFromMusicbill(musicbillId: string, musicId: string) {
  return request({
    method: Method.DELETE,
    path: '/api/musicbill_music',
    params: { musicbillId, musicId },
  });
}

export default removeMusicFromMusicbill;
