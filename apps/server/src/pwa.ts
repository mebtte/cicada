import path from 'path';
import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';

const app = new Koa();
app.use(range);
app.use(
  serve(path.join(__dirname, 'pwa'), {
    maxage: 365 * 24 * 60 * 3600,
  }),
);

export default app;
