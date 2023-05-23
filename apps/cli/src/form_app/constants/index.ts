import { User } from '@/constants/db_definition';
import { Context as BaseContext } from '@/constants/koa';

export interface Context extends BaseContext {
  user: User;
}
