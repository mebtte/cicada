import Router from 'koa-router';
import { DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import { Context } from './constants/koa';
import authorize from './middlewares/authorize';
import superAuthorize from './middlewares/super_authorize';

import getMetadata from './controllers/get_metadata';
import getCaptcha from './controllers/get_captcha';
import getLoginCode from './controllers/get_login_code';
import login from './controllers/login';
import getProfile from './controllers/get_profile';
import createUser from './controllers/create_user';

const router = new Router<DefaultState, Context>();

router.get('/metadata', getMetadata);
router.get('/captcha', getCaptcha);
router.get('/login_code', getLoginCode);
router.post('/login', bodyParser(), login);
router.get('/profile', authorize, getProfile);
router.put('/user', authorize, superAuthorize, createUser);

export default router;
