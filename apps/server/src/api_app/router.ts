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
import updateMusic from './controllers/update_music';
import searchSinger from './controllers/search_singer';
import createSinger from './controllers/create_singer';
import updateSinger from './controllers/update_singer';
import updateProfile from './controllers/update_profile';
import getSingerDetail from './controllers/get_singer_detail';
import getMusicDetail from './controllers/get_music_detail';
import getUserDetail from './controllers/get_user_detail';
import getSelfMusicList from './controllers/get_self_music_list';
import getSelfSingerList from './controllers/get_self_singer_list';
import deleteMusic from './controllers/delete_music';

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
router.put('/profile', authorize, parseBody, updateProfile); // 更新个人资料
router.get('/user_detail', authorize, getUserDetail); // 获取用户信息

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
router.put('/music', authorize, parseBody, updateMusic); // 更新音乐
router.delete('/music', authorize, deleteMusic); // 删除音乐
router.get('/music_detail', authorize, getMusicDetail); // 获取音乐详情
router.get('/music/search', authorize, searchMusic); // 搜索音乐
router.get('/self_music_list', authorize, getSelfMusicList); // 获取自己的音乐列表

router.get('/lyric', authorize, getLyric); // 获取音乐歌词

router.post('/singer', authorize, parseBody, createSinger); // 创建歌手
router.put('/singer', authorize, parseBody, updateSinger); // 更新歌手
router.get('/singer/search', authorize, searchSinger); // 搜索歌手
router.get('/singer_detail', authorize, getSingerDetail); // 获取歌手详情
router.get('/self_singer_list', authorize, getSelfSingerList); // 获取自己的歌手列表

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
