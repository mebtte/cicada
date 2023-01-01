import { Context as BaseContext } from '@/constants/koa';
import { User } from '@/db/user';

export interface Context extends BaseContext {
  user: User;
}
