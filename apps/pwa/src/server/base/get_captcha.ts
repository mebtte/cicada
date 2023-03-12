import { request } from '..';

function getCaptcha() {
  return request<{
    id: string;
    svg: string;
  }>({
    path: '/base/captcha',
  });
}

export default getCaptcha;
