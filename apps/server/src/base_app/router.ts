import Router from 'koa-router';
import { DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import { Context } from './constants';

import getMetadata from './controllers/get_metadata';
import getCaptcha from './controllers/get_captcha';
import getLoginCode from './controllers/get_login_code';
import login from './controllers/login';

const router = new Router<DefaultState, Context>();
const parseBody = bodyParser();

router.get('/metadata', getMetadata); // 获取元数据
router.get('/captcha', getCaptcha); // 获取验证码
router.get('/login_code', getLoginCode); // 获取登录验证码
router.post('/login', parseBody, login); // 登录

export default router;
