import path from 'path';
import Koa from 'koa';
import serve from 'koa-static';
import etag from 'koa-etag';
import definition from '@/definition';

export function getPwaApp() {
  const app = new Koa();
  app.use(etag());

  if (definition.BUILT) {
    app.use(serve(path.join(__dirname, 'pwa')));
  } else {
    app.use(serve(path.join(__dirname, '../../../../../dist/pwa')));
  }
  return app;
}
