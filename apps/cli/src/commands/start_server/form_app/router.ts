import Router from 'koa-router';
import { DefaultState } from 'koa';
import authorize from '../middlewares/authorize';
import { Context } from './constants';

import uploadAsset from './controllers/upload_asset';

const router = new Router<DefaultState, Context>();

router.post('/asset', authorize, uploadAsset);

export default router;
