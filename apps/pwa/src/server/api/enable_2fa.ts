import { RequestBody } from '#/server/api/enable_2fa';
import { Method, request } from '..';

function enable2FA(data: RequestBody) {
  return request({
    path: '/api/2fa',
    method: Method.PUT,
    withToken: true,
    body: {
      twoFAToken: data.twoFAToken,
    },
  });
}

export default enable2FA;
