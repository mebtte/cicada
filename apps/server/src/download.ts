import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import { ROOT_DOWNLOAD_DIR } from '@/constants/directory';

const app = new Koa();
app.use(range);
app.use(
  serve(ROOT_DOWNLOAD_DIR, {
    maxage: 365 * 24 * 60 * 3600,
  }),
);

export default app;
