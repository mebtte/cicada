import Koa, { DefaultState } from 'koa';
import parasite from './middlewares/parasite';
import catcher from './middlewares/catcher';
import { Context } from './constants/koa';

const app = new Koa<DefaultState, Context>();
app.use(parasite);
app.use(catcher);

export default app;
