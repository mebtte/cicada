import Koa, { DefaultState } from 'koa';
import parasite from '@/middlewares/parasite';
import catcher from '@/middlewares/catcher';
import { Context } from './constants';
import router from './router';

export function getBlobApp() {
  const app = new Koa<DefaultState, Context>();
  app.use(parasite);
  app.use(catcher);
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
