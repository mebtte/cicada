import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import catcher from '@/middlewares/catcher';
import parasite from '@/middlewares/parasite';
import { getAssetDirectory } from '../config';
import router from './router';

export function getAssetApp() {
  const app = new Koa();
  app.use(parasite);
  app.use(catcher);
  app.use(range);
  app.use(
    serve(getAssetDirectory(), {
      /**
       * maxAge 标准单位秒 koa-static 毫秒
       * @author mebtte<hi@mebtte.com>
       */
      maxAge: 1000 * 60 * 60 * 24 * 365, // 一年
    }),
  );
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
