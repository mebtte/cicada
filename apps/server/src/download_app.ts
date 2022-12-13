import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import { getDownloadDirectory } from './config';

export function getDownloadApp() {
  const app = new Koa();
  app.use(range);
  app.use(
    serve(getDownloadDirectory(), {
      /**
       * maxAge 标准单位秒 koa-static 毫秒
       * @author mebtte<hi@mebtte.com>
       */
      maxAge: 1000 * 60 * 60 * 24 * 365, // 一年
    }),
  );
  return app;
}
