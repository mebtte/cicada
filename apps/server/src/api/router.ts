import Router from 'koa-router';
import { DefaultState } from 'koa';
import { Context } from './constants/koa';

import getCaptcha from './controllers/get_captcha';
import getLoginCode from './controllers/get_login_code';

const router = new Router<DefaultState, Context>();

router.get('/captcha', getCaptcha);
router.get('/login_code', getLoginCode);

export default router;
