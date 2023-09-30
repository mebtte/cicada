import { RequestParams } from '#/server/api/disable_2fa';
import { Method, request } from '..';

function disable2FA(params: RequestParams) {
  return request({
    path: '/api/2fa',
    method: Method.DELETE,
    withToken: true,
    params: {
      twoFAToken: params.twoFAToken,
    },
  });
}

export default disable2FA;
