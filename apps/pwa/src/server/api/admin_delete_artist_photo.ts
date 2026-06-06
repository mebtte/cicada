import { request, Method } from '..';

function adminDeleteArtistPhoto(id: string) {
  return request({
    path: '/api/admin/artist/photo',
    method: Method.DELETE,
    withToken: true,
    body: { id },
    requestMinimalDuration: 0,
  });
}

export default adminDeleteArtistPhoto;
