import { Response } from '#/server/api/create_totp';
import { Method, request } from '..';

function createTotp() {
  return request<Response>({
    path: '/api/totp',
    method: Method.POST,
    withToken: true,
  });
}

export default createTotp;
