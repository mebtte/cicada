import { RequestBody } from '#/server/base/login';
import { request, Method } from '..';

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
