import { Method, request } from '..';

interface RequestBody {
  twoFAToken: string;
}

function enable2FA(data: RequestBody) {
  return request({
    path: '/api/common/2fa',
    method: Method.PUT,
    withToken: true,
    body: {
      token: data.twoFAToken,
    },
  });
}

export default enable2FA;
