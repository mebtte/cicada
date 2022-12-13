import path from 'path';
import Koa from 'koa';
import serve from 'koa-static';
import etag from 'koa-etag';
import { getConfig } from './config';

export function getPwaApp() {
  const app = new Koa();
  app.use(etag());
  app.use(
    serve(
      path.join(
        __dirname,
        getConfig().mode === 'development' ? '../../pwa/build' : './pwa',
      ),
    ),
  );
  return app;
}
