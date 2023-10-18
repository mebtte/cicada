import { RequestBody } from '#/server/base/login_with_2fa';
import { request, Method } from '..';

function loginWith2FA(data: RequestBody) {
  return request<string>({
    path: '/base/login_with_2fa',
    method: Method.POST,
    body: {
      username: data.username,
      password: data.password,
      twoFAToken: data.twoFAToken,
    },
  });
}

export default loginWith2FA;
