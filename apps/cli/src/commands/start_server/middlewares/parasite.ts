import { Next } from 'koa';
import { ExceptionCode, EXCEPTION_CODE_MAP } from '#/constants/exception';
import { Context } from '../../../constants/koa';

export default (ctx: Context, next: Next) => {
  ctx.success = (data) => {
    ctx.status = 200;
    ctx.body = {
      code: ExceptionCode.SUCCESS,
      data,
    };
  };
  ctx.except = (exceptionCode: ExceptionCode) => {
    ctx.body = {
      code: exceptionCode,
      message: EXCEPTION_CODE_MAP[exceptionCode].description,
    };
  };
  return next();
};
