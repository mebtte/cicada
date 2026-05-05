import { request, Method } from '..';

function adminReorderSingerPhotos({
  singerId,
  ids,
}: {
  singerId: string;
  ids: string[];
}) {
  return request({
    path: '/api/admin/singer/photo/order',
    method: Method.PUT,
    withToken: true,
    body: { singerId, ids },
    requestMinimalDuration: 0,
  });
}

export default adminReorderSingerPhotos;
