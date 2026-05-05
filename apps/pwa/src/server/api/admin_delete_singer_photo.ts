import { request, Method } from '..';

function adminDeleteSingerPhoto(id: string) {
  return request({
    path: '/api/admin/singer/photo',
    method: Method.DELETE,
    withToken: true,
    body: { id },
    requestMinimalDuration: 0,
  });
}

export default adminDeleteSingerPhoto;
