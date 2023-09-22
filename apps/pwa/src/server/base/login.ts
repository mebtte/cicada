import { request, Method } from '..';

function login({
  username,
  password,
  captchaId,
  captchaValue,
}: {
  username: string;
  password: string;
  captchaId: string;
  captchaValue: string;
}) {
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
