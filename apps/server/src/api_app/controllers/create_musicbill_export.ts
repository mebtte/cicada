import { ExceptionCode } from '#/constants/exception';
import { getMusicbillById, Property } from '@/db/musicbill';
import { getDB } from '@/db';
import day from '#/utils/day';
import { getConfig } from '@/config';
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

  const musicListTotal = await getDB().get<{
    value: number;
  }>(
    `
      SELECT
        count(*) AS value
      FROM musicbill_music
      WHERE musicbillId = ?
    `,
    [id],
  );
  if (!musicListTotal?.value) {
    return ctx.except(ExceptionCode.FORBID_EXPORT_EMPTY_MUSICBILL);
  }

  const now = day();
  const todayExportTimes = await getDB().get<{ value: number }>(
    `
      SELECT
        count(*) AS value
      FROM musicbill_export
      WHERE userId = ?
        AND createTimestamp >= ?
        AND createTimestamp < ?
    `,
    [ctx.user.id, now.startOf('day'), now.endOf('day')],
  );
  if (
    todayExportTimes!.value >= getConfig().userExportMusicbillMaxTimesPerDay
  ) {
    return ctx.except(ExceptionCode.OVER_EXPORT_MUSICBILL_TIMES_PER_DAY);
  }

  await getDB().run(
    `
      INSERT INTO musicbill_export ( userId, musicbillId, createTimestamp )
      VALUES ( ?, ?, ? )
    `,
    [ctx.user.id, id, Date.now()],
  );

  return ctx.success();
};
