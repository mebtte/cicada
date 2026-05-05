import { request, Method } from '..';

function adminUpdateSingerPhoto({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  return request({
    path: '/api/admin/singer/photo',
    method: Method.PUT,
    withToken: true,
    body: { id, description },
    requestMinimalDuration: 0,
  });
}

export default adminUpdateSingerPhoto;
