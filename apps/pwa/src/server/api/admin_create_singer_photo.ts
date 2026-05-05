import { request, Method } from '..';

function adminCreateSingerPhoto({
  singerId,
  asset,
  description,
}: {
  singerId: string;
  asset: string;
  description?: string;
}) {
  return request<{ id: string }>({
    path: '/api/admin/singer/photo',
    method: Method.POST,
    withToken: true,
    body: {
      singerId,
      asset,
      ...(description === undefined ? {} : { description }),
    },
    requestMinimalDuration: 0,
  });
}

export default adminCreateSingerPhoto;
