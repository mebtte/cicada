import { Context } from './constants/koa';
import getCaptcha from './apis/get_captcha';

enum Authentication {
  /** 无需鉴权 */
  NONE,
  /** 登录用户 */
  USER,
  /** 登录用户且拥有 CMS 权限 */
  CMS_USER,
}

const routes: {
  description: string;
  path: string;
  api: (ctx: Context) => void | Promise<void>;
  auth: Authentication;
}[] = [];

export default routes;
