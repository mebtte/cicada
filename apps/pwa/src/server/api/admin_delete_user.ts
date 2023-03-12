import { Method, request } from '..';

function adminDeleteUser(id: string) {
  return request({
    path: '/api/admin/user',
    method: Method.DELETE,
    params: { id },
    withToken: true,
    timeout: 1000 * 60,
  });
}

export default adminDeleteUser;
