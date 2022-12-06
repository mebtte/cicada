import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import { ExceptionCode } from '#/constants/exception';
import {
  createMusicbill,
  getUserMusicbillList,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import config from '@/config';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { name } = ctx.request.body as { name?: string };

  if (
    typeof name !== 'string' ||
    !name.length ||
    name.length > NAME_MAX_LENGTH
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbillList = await getUserMusicbillList(ctx.user.id, [
    MusicbillProperty.ID,
  ]);
  if (musicbillList.length > config.get().userMusicbillMaxAmount) {
    return ctx.except(ExceptionCode.OVER_USER_MUSICBILL_MAX_AMOUNT);
  }

  const id = await createMusicbill({ userId: ctx.user.id, name });
  return ctx.success(id);
};
