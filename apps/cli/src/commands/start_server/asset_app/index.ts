import Koa, { DefaultState } from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import etag from 'koa-etag';
import catcher from '@/commands/start_server/middlewares/catcher';
import parasite from '@/commands/start_server/middlewares/parasite';
import { getAssetDirectory } from '../../../config';
import router from './router';
import { Context } from './constants';

export function getAssetApp() {
  const app = new Koa<DefaultState, Context>();
  app.use(parasite);
  app.use(catcher());
  app.use(range);
  app.use(etag());
  app.use(router.routes()).use(router.allowedMethods());
  app.use(
    serve(getAssetDirectory(), {
      immutable: true,
    }),
  );
  return app;
}
