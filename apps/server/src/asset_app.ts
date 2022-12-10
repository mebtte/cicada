import Koa from 'koa';
import range from 'koa-range';
import serve from 'koa-static';
import { getAssetDirectory } from './config';

const app = new Koa();
app.use(range);
app.use(
  serve(getAssetDirectory(), {
    /**
     * maxAge 标准单位秒 koa-static 毫秒
     * @author mebtte<hi@mebtte.com>
     */
    maxAge: 1000 * 60 * 60 * 24 * 365, // 一年
  }),
);

export default app;
