import { request } from '.';

function getCaptcha() {
  return request<{
    id: string;
    svg: string;
  }>({
    path: '/api/captcha',
  });
}

export default getCaptcha;
