import Koa, { DefaultState } from 'koa';
import parasite from '@/commands/start_server/middlewares/parasite';
import catcher from '@/commands/start_server/middlewares/catcher';
import { Context } from './constants';
import router from './router';

export function getFormApp() {
  const app = new Koa<DefaultState, Context>();
  app.use(parasite);
  app.use(catcher());
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
