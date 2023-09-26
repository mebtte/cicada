import { RequestBody } from '#/server/base/login';
import { request, Method } from '..';

function login({ username, password, captchaId, captchaValue }: RequestBody) {
  return request<string>({
    path: '/base/login',
    method: Method.POST,
    body: {
      username,
      password,
      captchaId,
      captchaValue,
    },
  });
}

export default login;
