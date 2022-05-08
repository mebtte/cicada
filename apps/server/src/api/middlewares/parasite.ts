import { Context } from 'koa';
import { ExceptionCode, EXCEPTION_CODE_MAP } from '../exception';

export default (ctx: Context) => {
  ctx.success = (data) => {
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
};
