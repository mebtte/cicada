import Router from 'koa-router';
import { DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import { Context } from './constants';

import getMetadata from './controllers/get_metadata';
import getCaptcha from './controllers/get_captcha';
import login from './controllers/login';
import loginWith2FA from './controllers/login_with_2fa';
import createMusicPlayRecord from './controllers/create_music_play_record';

const router = new Router<DefaultState, Context>();
const parseBody = bodyParser();

router.get('/metadata', getMetadata);
router.get('/captcha', getCaptcha);
router.post('/login', parseBody, login);
router.post('/login_with_2fa', parseBody, loginWith2FA);

/**
 * 上传音乐播放记录
 * 由于使用 navigator.sendBeacon
 * 无法设置 http header, 需要特殊处理鉴权
 * @author mebtte<i@mebtte.com>
 */
router.post('/music_play_record', parseBody, createMusicPlayRecord);

export default router;
