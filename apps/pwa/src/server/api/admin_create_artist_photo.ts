import { request, Method } from '..';

function adminCreateArtistPhoto({
  artistId,
  asset,
  description,
}: {
  artistId: string;
  asset: string;
  description?: string;
}) {
  return request<{ id: string }>({
    path: '/api/admin/artist/photo',
    method: Method.POST,
    withToken: true,
    body: {
      artistId,
      asset,
      ...(description === undefined ? {} : { description }),
    },
    requestMinimalDuration: 0,
  });
}

export default adminCreateArtistPhoto;
