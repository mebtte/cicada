import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import { ROOT_TEMPORARY_DIR } from '@/constants/directory';

const app = new Koa();
app.use(range);
app.use(
  serve(ROOT_TEMPORARY_DIR, {
    maxage: 365 * 24 * 60 * 3600,
  }),
);

export default app;
