import { Method, request } from '..';

type Response = string;

function create2FA() {
  return request<Response>({
    path: '/api/2fa',
    method: Method.POST,
    withToken: true,
    requestMinimalDuration: 0,
  });
}

export default create2FA;
