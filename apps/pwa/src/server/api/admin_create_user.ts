import { Method, request } from '..';

function adminCreateUser({
  username,
  password,
  remark,
}: {
  username: string;
  password: string;
  remark: string;
}) {
  return request({
    path: '/api/admin/user',
    method: Method.POST,
    body: {
      username,
      password,
      remark,
    },
    withToken: true,
  });
}

export default adminCreateUser;
