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
import getLyric from './controllers/get_lyric';
import createMusicbill from './controllers/create_musicbill';
import updateMusicbillOrder from './controllers/update_musicbill_order';
import deleteMusicbill from './controllers/delete_musicbill';
import updateMusicbill from './controllers/update_musicbill';
import searchMusic from './controllers/search_music';
import createMusicbillExport from './controllers/create_musicbill_export';
import createMusic from './controllers/create_music';

const router = new Router<DefaultState, Context>();
const parseBody = bodyParser();

router.get('/metadata', getMetadata); // 元数据
router.get('/captcha', getCaptcha); // 获取验证码
router.get('/login_code', getLoginCode); // 获取登录验证码
router.post('/login', parseBody, login); // 登录

/**
 * authorize
 */
router.get('/profile', authorize, getProfile); // 获取个人资料

router.get('/self_musicbill_list', authorize, getSelfMusicbillList); // 获取个人乐单列表
router.get('/self_musicbill', authorize, getSelfMusicbill); // 获取个人乐单
router.post('/musicbill', authorize, parseBody, createMusicbill); // 创建乐单
router.delete('/musicbill', authorize, deleteMusicbill); // 删除乐单
router.put('/musicbill', authorize, parseBody, updateMusicbill); // 更新乐单
router.post('/musicbill_music', authorize, parseBody, addMusicToMusicbill); // 添加音乐到乐单
router.delete('/musicbill_music', authorize, removeMusicFromMusicbill); // 从乐单移除音乐
router.post('/musicbill_order', authorize, parseBody, updateMusicbillOrder); // 更新乐单顺序
router.post('/musicbill_export', authorize, parseBody, createMusicbillExport); // 创建乐单导出

router.post('/music', authorize, parseBody, createMusic); // 创建音乐
router.get('/music/search', authorize, searchMusic); // 搜索音乐

router.get('/lyric', authorize, getLyric); // 获取音乐歌词

/**
 * super authorize
 */
router.post('/user', authorize, superAuthorize, parseBody, createUser); // 创建用户

/**
 * 上传音乐播放记录使用的是 navigator.sendBeacon
 * 无法设置 http header
 * 需要特殊处理鉴权
 */
router.post('/music_play_record', parseBody, uploadMusicPlayRecord); // 上传音乐播放记录

export default router;
