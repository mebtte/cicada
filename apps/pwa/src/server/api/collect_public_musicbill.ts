import { Method, request } from '..';

function collectPublicMusicbill(id: string) {
  return request({
    path: '/api/common/public_musicbill/collection',
    method: Method.POST,
    body: { id },
    withToken: true,
    requestMinimalDuration: 0,
  });
}

export default collectPublicMusicbill;
