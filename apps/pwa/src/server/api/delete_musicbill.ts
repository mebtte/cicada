import { request, Method } from '..';

function deleteMusicbill(id: string) {
  return request({
    method: Method.DELETE,
    path: '/api/musicbill',
    params: { id },
    withToken: true,
  });
}

export default deleteMusicbill;
