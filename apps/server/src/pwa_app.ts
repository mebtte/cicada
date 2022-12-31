import path from 'path';
import Koa from 'koa';
import serve from 'koa-static';
import etag from 'koa-etag';
import definition from './definition';

export function getPwaApp() {
  const app = new Koa();
  app.use(etag());
  app.use(
    serve(path.join(__dirname, definition.BUILD ? './pwa' : '../../../pwa')),
  );
  return app;
}
