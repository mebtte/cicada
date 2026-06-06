import { request, Method } from '..';

function adminReorderArtistPhotos({
  artistId,
  ids,
}: {
  artistId: string;
  ids: string[];
}) {
  return request({
    path: '/api/admin/artist/photo/order',
    method: Method.PUT,
    withToken: true,
    body: { artistId, ids },
    requestMinimalDuration: 0,
  });
}

export default adminReorderArtistPhotos;
