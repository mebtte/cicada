import { Method, request } from '..';

function adminDeleteSinger(id: string) {
  return request({
    path: '/api/admin/singer',
    method: Method.DELETE,
    params: { id },
    withToken: true,
    requestMinimalDuration: 0,
  });
}

export default adminDeleteSinger;
