import { Method, request } from '..';

interface Response {
  secret: string;
  url: string;
}

function create2FA() {
  return request<Response>({
    path: '/api/2fa',
    method: Method.POST,
    withToken: true,
    requestMinimalDuration: 0,
  });
}

export default create2FA;
