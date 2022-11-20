import { Method, request } from '.';

function collectPublicMusicbill(id: string) {
  return request({
    path: '/api/public_musicbill/collection',
    method: Method.POST,
    body: { id },
    withToken: true,
    minDuration: 0,
  });
}

export default collectPublicMusicbill;
