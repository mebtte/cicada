import Koa, { DefaultState } from 'koa';
import parasite from '@/middlewares/parasite';
import catcher from '@/middlewares/catcher';
import { Context } from './constants';
import router from './router';

export function getFormApp() {
  const app = new Koa<DefaultState, Context>();
  app.use(parasite);
  app.use(catcher({ label: 'form_app' }));
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
