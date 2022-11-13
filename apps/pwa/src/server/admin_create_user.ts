import { Method, request } from '.';

function adminCreateUser({ email, remark }: { email: string; remark: string }) {
  return request({
    path: '/api/admin/user',
    method: Method.POST,
    body: {
      email,
      remark,
    },
    withToken: true,
  });
}

export default adminCreateUser;
