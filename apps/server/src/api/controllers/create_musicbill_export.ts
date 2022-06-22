import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById, Property } from '@/db/musicbill';
import * as db from '@/db';
import day from '#/utils/day';
import argv from '@/argv';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.request.body as {
    id?: unknown;
  };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [
    Property.USER_ID,
    Property.PUBLIC,
  ]);
  if (!musicbill || (!musicbill.public && musicbill.userId !== ctx.user.id)) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const musicListTotal = await db.get<{
    value: number;
  }>(
    `
      select count(*) as value from musicbill_music
        where musicbillId = ?
    `,
    [id],
  );
  if (!musicListTotal?.value) {
    return ctx.except(ExceptionCode.FORBID_EXPORT_EMPTY_MUSICBILL);
  }

  const now = day();
  const todayExportTimes = await db.get<{ value: number }>(
    `
      select count(*) as value from musicbill_export
        where userId = ?
          and createTimestamp >= ? and createTimestamp < ?
    `,
    [ctx.user.id, now.startOf('day'), now.endOf('day')],
  );
  if (todayExportTimes!.value >= argv.userExportMusicbillMaxTimesPerDay) {
    return ctx.except(ExceptionCode.OVER_EXPORT_MUSICBILL_TIMES_PER_DAY);
  }

  await db.run(
    `
    insert into musicbill_export(userId, musicbillId, createTimestamp)
      values(?, ?, ?)
  `,
    [ctx.user.id, id, Date.now()],
  );

  return ctx.success();
};
