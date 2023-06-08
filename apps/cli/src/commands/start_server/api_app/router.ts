import Router from 'koa-router';
import { DefaultState } from 'koa';
import bodyParser from 'koa-bodyparser';
import adminAuthorize from '@/commands/start_server/middlewares/admin_authorize';
import { Context } from './constants';

import getProfile from './controllers/get_profile';
import getMusicbillList from './controllers/get_musicbill_list';
import getMusicbill from './controllers/get_musicbill';
import addMusicToMusicbill from './controllers/add_music_to_musicbill';
import removeMusicFromMusicbill from './controllers/remove_music_from_musicbill';
import getLyricList from './controllers/get_lyric_list';
import createMusicbill from './controllers/create_musicbill';
import deleteMusicbill from './controllers/delete_musicbill';
import updateMusicbill from './controllers/update_musicbill';
import searchMusic from './controllers/search_music';
import createMusic from './controllers/create_music';
import updateMusic from './controllers/update_music';
import searchSinger from './controllers/search_singer';
import createSinger from './controllers/create_singer';
import updateSinger from './controllers/update_singer';
import updateProfile from './controllers/update_profile';
import getSinger from './controllers/get_singer';
import getMusic from './controllers/get_music';
import getUser from './controllers/get_user';
import getMusicList from './controllers/get_music_list';
import deleteMusic from './controllers/delete_music';
import searchMusicByLyric from './controllers/search_music_by_lyric';
import getPublicMusicbill from './controllers/get_public_musicbill';
import searchPublicMusicbill from './controllers/search_public_musicbill';
import collectPublicMusicbill from './controllers/collect_public_musicbill';
import uncollectPublicMusicbill from './controllers/uncollect_public_musicbill';
import getPublicMusicbillCollectionList from './controllers/get_public_musicbill_collection_list';
import getExploration from './controllers/get_exploration';
import getMusicPlayRecordList from './controllers/get_music_play_record_list';
import deleteMusicPlayRecord from './controllers/delete_music_play_record';
import addMusicbillSharedUser from './controllers/add_musicbill_shared_user';
import deleteMusicbillSharedUser from './controllers/delete_musicbill_shared_user';
import getSharedMusicbillInvitationList from './controllers/get_shared_musicbill_invitation_list';
import acceptSharedMusicbillInvitation from './controllers/accept_shared_musicbill_invitation';

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
router.get('/user', getUser); // 获取用户
router.get('/musicbill_list', getMusicbillList); // 获取乐单列表
router.get('/musicbill', getMusicbill); // 获取乐单
router.post('/musicbill', parseBody, createMusicbill); // 创建乐单
router.delete('/musicbill', deleteMusicbill); // 删除乐单
router.put('/musicbill', parseBody, updateMusicbill); // 更新乐单
router.post('/musicbill_music', parseBody, addMusicToMusicbill); // 添加音乐到乐单
router.delete('/musicbill_music', removeMusicFromMusicbill); // 从乐单移除音乐
router.get('/public_musicbill', getPublicMusicbill); // 获取公开乐单
router.post('/public_musicbill/collection', parseBody, collectPublicMusicbill); // 收藏公开乐单
router.delete('/public_musicbill/collection', uncollectPublicMusicbill); // 取消收藏公开乐单
router.get('/public_musicbill/search', searchPublicMusicbill); // 搜索公开乐单
router.get(
  '/public_musicbill_collection_list',
  getPublicMusicbillCollectionList,
); // 获取公开乐单收藏列表
router.post('/musicbill/shared_user', parseBody, addMusicbillSharedUser); // 乐单添加共享用户
router.delete('/musicbill/shared_user', deleteMusicbillSharedUser); // 乐单移除共享用户
router.get(
  '/shared_musicbill_invitation_list',
  getSharedMusicbillInvitationList,
); // 获取共享乐单邀请列表
router.put(
  '/shared_musicbill_invitation',
  parseBody,
  acceptSharedMusicbillInvitation,
); // 接受共享乐单邀请
router.post('/music', parseBody, createMusic); // 创建音乐
router.put('/music', parseBody, updateMusic); // 更新音乐
router.delete('/music', deleteMusic); // 删除音乐
router.get('/music', getMusic); // 获取音乐
router.get('/music/search', searchMusic); // 搜索音乐
router.get('/music/search_by_lyric', searchMusicByLyric); // 通过歌词搜索音乐
router.get('/music_list', getMusicList); // 获取音乐列表
router.get('/lyric_list', getLyricList); // 获取音乐歌词列表
router.post('/singer', parseBody, createSinger); // 创建歌手
router.put('/singer', parseBody, updateSinger); // 更新歌手
router.get('/singer/search', searchSinger); // 搜索歌手
router.get('/singer', getSinger); // 获取歌手
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
