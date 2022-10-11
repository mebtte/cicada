import path from 'path';
import Koa from 'koa';
import serve from 'koa-static';
import etag from 'koa-etag';

const app = new Koa();
app.use(etag());
app.use(
  serve(
    path.join(
      __dirname,
      process.env.NODE_ENV === 'production' ? './pwa' : '../../pwa/build',
    ),
  ),
);

export default app;
