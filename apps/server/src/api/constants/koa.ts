import { Context as OriginalContext } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import type { User } from '../../platform/user';

export interface Context extends OriginalContext {
  success: <Data>(data?: Data) => void;
  except: (exceptionCode: ExceptionCode) => void;
  user: User;
}
