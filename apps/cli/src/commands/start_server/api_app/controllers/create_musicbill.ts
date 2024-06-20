import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import { ExceptionCode } from '#/constants/exception';
import { createMusicbill, getUserMusicbillList } from '@/db/musicbill';
import { MusicbillProperty } from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { name } = ctx.request.body as { name?: string };

  if (
    typeof name !== 'string' ||
    !name.length ||
    name.length > NAME_MAX_LENGTH
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  /**
   * 0 表示无限制
   * @author mebtte<i@mebtte.com>
   */
  if (ctx.user.musicbillMaxAmount !== 0) {
    const musicbillList = await getUserMusicbillList(ctx.user.id, [
      MusicbillProperty.ID,
    ]);
    if (musicbillList.length > ctx.user.musicbillMaxAmount) {
      return ctx.except(ExceptionCode.OVER_USER_MUSICBILL_MAX_AMOUNT);
    }
  }

  const id = await createMusicbill({ userId: ctx.user.id, name });
  return ctx.success(id);
};
