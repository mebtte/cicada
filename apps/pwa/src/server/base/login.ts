import { request, Method } from '..';

function login({ email, loginCode }: { email: string; loginCode: string }) {
  return request<string>({
    path: '/base/login',
    method: Method.POST,
    body: {
      email,
      loginCode,
    },
  });
}

export default login;
