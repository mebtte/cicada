import { request, Method } from '..';

function addMusicToMusicbill(musicbillId: string, musicId: string) {
  return request({
    method: Method.POST,
    path: '/api/common/musicbill_music',
    body: {
      musicbillId,
      musicId,
    },
    withToken: true,
  });
}

export default addMusicToMusicbill;
