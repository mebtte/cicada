import { request, Method } from '..';

interface RequestBody {
  username: string;
  password: string;
  captchaId: string;
  captchaValue: string;
  deviceName?: string;
}

export interface LoginResponse {
  token: string;
  sessionId: string;
}

function login(data: RequestBody) {
  return request<LoginResponse>({
    path: '/base/login',
    method: Method.POST,
    body: {
      username: data.username,
      password: data.password,
      captchaId: data.captchaId,
      captchaValue: data.captchaValue,
      deviceName: data.deviceName,
    },
  });
}

export default login;
