import { request } from '..';

function getCaptcha() {
  return request<{
    id: string;
    svg: string;
  }>({
    path: '/api/base/captcha',
  });
}

export default getCaptcha;
