import { createServer } from 'http';
import Koa from 'koa';

const app = new Koa();

export default {
  start: (port: number) => createServer(app.callback()).listen(port),
};
