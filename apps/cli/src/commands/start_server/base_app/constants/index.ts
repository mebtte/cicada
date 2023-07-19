import { Context as BaseContext } from '../../constants';
import { ParasiteMiddleware } from '../../middlewares/parasite';

export type Context = BaseContext & ParasiteMiddleware;
