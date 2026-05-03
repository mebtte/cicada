import { Method, request } from '..';

interface RequestParams {
  twoFAToken: string;
}

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
