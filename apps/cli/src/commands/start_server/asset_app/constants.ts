import { Context as BaseContext } from 'koa';
import { ParasiteMiddleware } from '../middlewares/parasite';

export type Context = BaseContext & ParasiteMiddleware;
