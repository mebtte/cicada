import { request, Method } from '..';

function adminUpdateArtistPhoto({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  return request({
    path: '/api/admin/artist/photo',
    method: Method.PUT,
    withToken: true,
    body: { id, description },
    requestMinimalDuration: 0,
  });
}

export default adminUpdateArtistPhoto;
