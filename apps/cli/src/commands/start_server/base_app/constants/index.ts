import { Context as BaseContext } from 'koa';
import { Parasite } from '../../middlewares/parasite';

export type Context = BaseContext & Parasite;
