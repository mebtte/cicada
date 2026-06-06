import { Method, request } from '..';

function adminDeleteArtist(id: string) {
  return request({
    path: '/api/admin/artist',
    method: Method.DELETE,
    params: { id },
    withToken: true,
    requestMinimalDuration: 0,
  });
}

export default adminDeleteArtist;
