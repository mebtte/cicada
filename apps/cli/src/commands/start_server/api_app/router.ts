import Router from 'koa-router';
import { DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import adminAuthorize from '@/commands/start_server/middlewares/admin_authorize';
import { Context } from './constants';

import getProfile from './controllers/get_profile';
import getSelfMusicbillList from './controllers/get_self_musicbill_list';
import getSelfMusicbill from './controllers/get_self_musicbill';
import addMusicToMusicbill from './controllers/add_music_to_musicbill';
import removeMusicFromMusicbill from './controllers/remove_music_from_musicbill';
import getLyricList from './controllers/get_lyric_list';
import createMusicbill from './controllers/create_musicbill';
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
import searchMusicByLyric from './controllers/search_music_by_lyric';
import getPublicMusicbill from './controllers/get_public_musicbill';
import searchPublicMusicbill from './controllers/search_public_musicbill';
import collectPublicMusicbill from './controllers/collect_public_musicbill';
import uncollectPublicMusicbill from './controllers/uncollect_public_musicbill';
import getSelfMusicbillCollectionList from './controllers/get_self_musicbill_collection_list';
import getExploration from './controllers/get_exploration';
import getMusicPlayRecordList from './controllers/get_music_play_record_list';
import deleteMusicPlayRecord from './controllers/delete_music_play_record';
import getMusicbillSharedUserList from './controllers/get_musicbill_shared_user_list';
import addMusicbillSharedUser from './controllers/add_musicbill_shared_user';
import deleteMusicbillSharedUser from './controllers/delete_musicbill_shared_user';

import adminCreateUser from './controllers/admin_create_user';
import adminUpdateUser from './controllers/admin_update_user';
import adminUpdateUserAdmin from './controllers/admin_update_user_admin';
import adminDeleteUser from './controllers/admin_delete_user';
import adminGetUserList from './controllers/admin_get_user_list';

const router = new Router<DefaultState, Context>();
const parseBody = bodyParser();

router.get('/exploration', getExploration); // 获取推荐内容

router.get('/profile', getProfile); // 获取个人资料
router.put('/profile', parseBody, updateProfile); // 更新个人资料
router.get('/user_detail', getUserDetail); // 获取用户信息

router.get('/self_musicbill_list', getSelfMusicbillList); // 获取个人乐单列表
router.get('/self_musicbill', getSelfMusicbill); // 获取个人乐单
router.post('/musicbill', parseBody, createMusicbill); // 创建乐单
router.delete('/musicbill', deleteMusicbill); // 删除乐单
router.put('/musicbill', parseBody, updateMusicbill); // 更新乐单
router.post('/musicbill_music', parseBody, addMusicToMusicbill); // 添加音乐到乐单
router.delete('/musicbill_music', removeMusicFromMusicbill); // 从乐单移除音乐
router.post('/musicbill_export', parseBody, createMusicbillExport); // 创建乐单导出
router.get('/public_musicbill', getPublicMusicbill); // 获取公开歌单
router.post('/public_musicbill/collection', parseBody, collectPublicMusicbill); // 收藏公开乐单
router.delete('/public_musicbill/collection', uncollectPublicMusicbill); // 取消收藏公开乐单
router.get('/public_musicbill/search', searchPublicMusicbill); // 搜索公开乐单
router.get('/self_musicbill_collection_list', getSelfMusicbillCollectionList); // 获取乐单收藏列表
router.get('/musicbill/shared_user_list', getMusicbillSharedUserList); // 获取乐单共享用户列表
router.post('/musicbill/shared_user', parseBody, addMusicbillSharedUser); // 乐单添加共享用户
router.delete('/musicbill/shared_user', deleteMusicbillSharedUser); // 乐单移除共享用户

router.post('/music', parseBody, createMusic); // 创建音乐
router.put('/music', parseBody, updateMusic); // 更新音乐
router.delete('/music', deleteMusic); // 删除音乐
router.get('/music_detail', getMusicDetail); // 获取音乐详情
router.get('/music/search', searchMusic); // 搜索音乐
router.get('/music/search_by_lyric', searchMusicByLyric); // 通过歌词搜索音乐
router.get('/self_music_list', getSelfMusicList); // 获取自己的音乐列表
router.get('/lyric_list', getLyricList); // 获取音乐歌词列表

router.post('/singer', parseBody, createSinger); // 创建歌手
router.put('/singer', parseBody, updateSinger); // 更新歌手
router.get('/singer/search', searchSinger); // 搜索歌手
router.get('/singer_detail', getSingerDetail); // 获取歌手详情
router.get('/self_singer_list', getSelfSingerList); // 获取自己的歌手列表
router.delete('/music_play_record', deleteMusicPlayRecord); // 删除音乐播放记录
router.get('/music_play_record_list', getMusicPlayRecordList); // 获取音乐播放记录列表

/**
 * 管理员
 * @author mebtte<hi@mebtte.com>
 */
router.post('/admin/user', adminAuthorize, parseBody, adminCreateUser); // 创建用户
router.put('/admin/user', adminAuthorize, parseBody, adminUpdateUser); // 更新用户
router.put(
  '/admin/user_admin',
  adminAuthorize,
  parseBody,
  adminUpdateUserAdmin,
); // 设用户为管理员
router.delete('/admin/user', adminAuthorize, adminDeleteUser); // 删除用户
router.get('/admin/user_list', adminAuthorize, adminGetUserList); // 获取用户列表

export default router;
