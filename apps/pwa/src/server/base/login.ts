import { request, Method } from '..';

interface RequestBody {
  username: string;
  password: string;
  captchaId: string;
  captchaValue: string;
}

function login(data: RequestBody) {
  return request<string>({
    path: '/base/login',
    method: Method.POST,
    body: {
      username: data.username,
      password: data.password,
      captchaId: data.captchaId,
      captchaValue: data.captchaValue,
    },
  });
}

export default login;
