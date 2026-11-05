import { request } from '..';

function getCaptcha() {
  return request<{
    id: string;
    image: string;
  }>({
    path: '/api/base/captcha',
  });
}

export default getCaptcha;
