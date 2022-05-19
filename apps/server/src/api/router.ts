import Router from 'koa-router';
import getCaptcha from './apis/get_captcha';
import { Context } from './constants/koa';

const router = new Router<{}, Context>();

router.get('/captcha', getCaptcha);

export default router;
