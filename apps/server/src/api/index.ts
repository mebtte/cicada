import Koa from 'koa';
import parasite from './middlewares/parasite';
import catcher from './middlewares/catcher';

const app = new Koa();
app.use(parasite);
app.use(catcher);

export default app;
