import { DefaultState } from 'koa';
import Router from 'koa-router';
import { AssetType } from '#/constants';
import { Context } from './constants';
import getImage from './controllers/get_image';

const router = new Router<DefaultState, Context>();
router.get(`/${AssetType.MUSIC_COVER}/:asset`, (ctx) =>
  getImage(ctx, { type: AssetType.MUSIC_COVER }),
);
router.get(`/${AssetType.SINGER_AVATAR}/:asset`, (ctx) =>
  getImage(ctx, { type: AssetType.SINGER_AVATAR }),
);
router.get(`/${AssetType.MUSICBILL_COVER}/:asset`, (ctx) =>
  getImage(ctx, { type: AssetType.MUSICBILL_COVER }),
);
router.get(`/${AssetType.USER_AVATAR}/:asset`, (ctx) =>
  getImage(ctx, { type: AssetType.USER_AVATAR }),
);

export default router;
