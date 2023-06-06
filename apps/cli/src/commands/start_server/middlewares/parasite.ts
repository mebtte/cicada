import { Next, Context } from 'koa';
import { ExceptionCode, EXCEPTION_CODE_MAP } from '#/constants/exception';

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
      message: EXCEPTION_CODE_MAP[exceptionCode].description,
    };
  };
  return next();
};
