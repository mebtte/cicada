import { RequestBody } from '#/server/base/login';
import { request, Method } from '..';

function login({ username, password, totpToken }: RequestBody) {
  return request<string>({
    path: '/base/login',
    method: Method.POST,
    body: {
      username,
      password,
      totpToken,
    },
  });
}

export default login;
