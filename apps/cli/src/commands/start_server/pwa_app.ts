import path from 'path';
import Koa from 'koa';
import serve from 'koa-static';
import etag from 'koa-etag';

export function getPwaApp() {
  const app = new Koa();
  app.use(etag());
  app.use(serve(path.join(__dirname, 'pwa')));
  return app;
}
