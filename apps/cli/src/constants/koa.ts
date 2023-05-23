import { Context as OriginalContext } from 'koa';
import { ExceptionCode } from '#/constants/exception';

export interface Context extends OriginalContext {
  success: <Data>(data: Data) => void;
  except: (
    exceptionCode: ExceptionCode,
    statusCode?: 200 | 400 | 404 | 500,
  ) => void;
}
