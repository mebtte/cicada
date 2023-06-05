import { Context as BaseContext } from 'koa';
import { ParasiteMiddleware } from '../../middlewares/parasite';
import { AuthorizeMiddleware } from '../../middlewares/authorize';

export type Context = BaseContext & ParasiteMiddleware & AuthorizeMiddleware;
