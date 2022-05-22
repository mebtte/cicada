import { Context } from '../constants/koa';

export default (ctx: Context) => ctx.success(ctx.user);
