import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import asset from './platform/asset';

const app = new Koa();
app.use(range);
app.use(
  serve(asset.ASSET_DIR, {
    maxage: 365 * 24 * 60 * 3600,
  }),
);

export default app;
