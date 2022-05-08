import { Context as BaseContext } from 'koa';
import { ExceptionCode } from './exception';

declare module 'koa' {
  interface Context extends BaseContext {
    success<Data>(data: Data): void;
    except(exceptionCode: ExceptionCode): void;
  }
}
