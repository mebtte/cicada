import { Method, request } from '..';

function uncollectPublicMusicbill(id: string) {
  return request({
    path: '/api/public_musicbill/collection',
    method: Method.DELETE,
    params: { id },
    withToken: true,
    requestMinimalDuration: 0,
  });
}

export default uncollectPublicMusicbill;
