import { Next } from 'koa';
import { ExceptionCode } from '#/constants/exception';
import { Context, EXCEPTION_CODE_MAP_KEY } from '../constants';

export interface ParasiteMiddleware {
  success: <Data>(data: Data) => void;
  except: (exceptionCode: ExceptionCode) => void;
}

export default (ctx: Context & ParasiteMiddleware, next: Next) => {
  ctx.success = (data) => {
    ctx.status = 200;
    ctx.body = {
      code: ExceptionCode.SUCCESS,
      data,
    };
  };
  ctx.except = (exceptionCode) => {
    ctx.body = {
      code: exceptionCode,
      message: ctx.t(EXCEPTION_CODE_MAP_KEY[exceptionCode]),
    };
  };
  return next();
};
