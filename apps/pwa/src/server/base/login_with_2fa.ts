import { request, Method } from '..';

interface RequestBody {
  username: string;
  password: string;
  twoFAToken: string;
}

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
