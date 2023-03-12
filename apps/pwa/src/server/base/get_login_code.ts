import { request } from '..';

function getLoginCode(params: {
  email: string;
  captchaId: string;
  captchaValue: string;
}) {
  return request({
    path: '/base/login_code',
    params,
  });
}

export default getLoginCode;
