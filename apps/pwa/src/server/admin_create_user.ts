import setting from '@/global_states/setting';
import { Method, request } from '.';

function adminCreateUser({ email, remark }: { email: string; remark: string }) {
  return request({
    path: '/api/admin/user',
    method: Method.POST,
    body: {
      email,
      remark,
      accessOrigin: setting.get().serverOrigin || window.location.origin,
    },
    withToken: true,
  });
}

export default adminCreateUser;
