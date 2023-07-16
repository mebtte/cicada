import { Context as BaseContext } from 'koa';
import { I18nMiddleware } from '../middlewares/i18n';

export type Context = BaseContext & I18nMiddleware;
