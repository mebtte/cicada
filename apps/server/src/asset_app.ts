import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import { ROOT_ASSET_DIR } from '@/constants/directory';

const app = new Koa();
app.use(range);
app.use(
  serve(ROOT_ASSET_DIR, {
    /**
     * maxAge 标准单位秒 koa-static 毫秒
     * @author mebtte<hi@mebtte.com>
     */
    maxAge: 1000 * 60 * 60 * 24 * 365, // 一年
  }),
);

export default app;
