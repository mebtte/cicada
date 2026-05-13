import { request, Method } from '..';
import type { LoginResponse } from './login';

interface RequestBody {
  username: string;
  password: string;
  twoFAToken: string;
  deviceName?: string;
}

function loginWith2FA(data: RequestBody) {
  return request<LoginResponse>({
    path: '/base/login_with_2fa',
    method: Method.POST,
    body: {
      username: data.username,
      password: data.password,
      twoFAToken: data.twoFAToken,
      deviceName: data.deviceName,
    },
  });
}

export default loginWith2FA;
