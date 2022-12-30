import { Context } from '@/constants/koa';
import { DefaultState } from 'koa';
import Router from 'koa-router';
import resizeMusicCover from './controllers/resize_music_cover';

const router = new Router<DefaultState, Context>();
router.get('/resized_music_cover', resizeMusicCover);

export default router;
