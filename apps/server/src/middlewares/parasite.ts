import { Next } from 'koa';
import { ExceptionCode, EXCEPTION_CODE_MAP } from '#/constants/exception';
import { Context } from '../constants/koa';

export default (ctx: Context, next: Next) => {
  ctx.success = (data) => {
    ctx.body = {
      code: ExceptionCode.SUCCESS,
      data,
    };
  };
  ctx.except = (
    exceptionCode: ExceptionCode,
    statusCode: 200 | 400 | 404 | 400 = 200,
  ) => {
    ctx.status = statusCode;
    ctx.body = {
      code: exceptionCode,
      message: EXCEPTION_CODE_MAP[exceptionCode].description,
    };
  };
  return next();
};
