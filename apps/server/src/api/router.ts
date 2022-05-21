import Router from 'koa-router';
import { DefaultState } from 'koa';
import getCaptcha from './controllers/get_captcha';
import { Context } from './constants/koa';

const router = new Router<DefaultState, Context>();

router.get('/captcha', getCaptcha);

export default router;
