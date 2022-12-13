import { Method, request } from '.';

function adminCreateUser({ email, remark }: { email: string; remark: string }) {
  return request({
    path: '/api/admin/user',
    method: Method.POST,
    body: {
      email,
      remark,
      accessOrigin: window.location.origin,
    },
    withToken: true,
  });
}

export default adminCreateUser;
