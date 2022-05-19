import { ExceptionCode, EXCEPTION_CODE_MAP } from '#/constants/exception';
import { Context } from '../constants/koa';

export default (ctx: Context) => {
  ctx.success = (data) => {
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
};
