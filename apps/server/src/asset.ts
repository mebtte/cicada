import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import { ASSET_DIR } from '#/constants/directory';

const app = new Koa();
app.use(range);
app.use(
  serve(ASSET_DIR.ROOT, {
    maxage: 365 * 24 * 60 * 3600,
  }),
);

export default app;
