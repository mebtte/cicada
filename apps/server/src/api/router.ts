import Router from 'koa-router';
import { DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import authorize from '@/middlewares/authorize';
import superAuthorize from '@/middlewares/super_authorize';
import { Context } from './constants';

import getMetadata from './controllers/get_metadata';
import getCaptcha from './controllers/get_captcha';
import getLoginCode from './controllers/get_login_code';
import login from './controllers/login';
import getProfile from './controllers/get_profile';
import createUser from './controllers/create_user';
import getSelfMusicbillList from './controllers/get_self_musicbill_list';
import getSelfMusicbill from './controllers/get_self_musicbill';
import addMusicToMusicbill from './controllers/add_music_to_musicbill';
import removeMusicFromMusicbill from './controllers/remove_music_from_musicbill';
import uploadMusicPlayRecord from './controllers/upload_music_play_record';
import getMusicLrc from './controllers/get_music_lrc';

const router = new Router<DefaultState, Context>();
const parseBody = bodyParser();

router.get('/metadata', getMetadata);
router.get('/captcha', getCaptcha);
router.get('/login_code', getLoginCode);
router.post('/login', parseBody, login);

/** authorize */
router.get('/profile', authorize, getProfile);
router.get('/self_musicbill_list', authorize, getSelfMusicbillList);
router.get('/self_musicbill', authorize, getSelfMusicbill);
router.post('/musicbill_music', authorize, parseBody, addMusicToMusicbill);
router.delete('/musicbill_music', authorize, removeMusicFromMusicbill);
router.get('/music_lrc', authorize, getMusicLrc);

/** super authorize */
router.post('/user', authorize, superAuthorize, parseBody, createUser);

/**
 * 上传音乐记录使用的是 navigator.sendBeacon
 * 无法设置 http header
 * 需要特殊处理鉴权
 */
router.post('/music_play_record', parseBody, uploadMusicPlayRecord);

export default router;
