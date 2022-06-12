import { ExceptionCode } from '#/constants/exception';
import { getMusicbillListByIds, Property } from '@/db/musicbill';
import { updateUserMusicbillOrders } from '@/db/user_musicbill_order';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { orders } = ctx.request.body as {
    orders?: string[];
  };
  if (
    !orders ||
    !(orders instanceof Array) ||
    !orders.length ||
    orders.find((o) => typeof o !== 'string')
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbillList = await getMusicbillListByIds(orders, [Property.USER_ID]);
  if (musicbillList.length !== orders.length) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const notUserMusicbill = musicbillList.find((m) => m.userId !== ctx.user.id);
  if (notUserMusicbill) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  await updateUserMusicbillOrders(ctx.user.id, orders);
  return ctx.success();
};
