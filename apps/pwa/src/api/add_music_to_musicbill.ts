import { request, Method } from '.';

function addMusicToMusicbill(musicbillId: string, musicId: string) {
  return request({
    method: Method.POST,
    path: '/api/musicbill_music',
    body: {
      musicbillId,
      musicId,
    },
  });
}

export default addMusicToMusicbill;
