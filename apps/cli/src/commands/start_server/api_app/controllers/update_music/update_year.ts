import { ExceptionCode } from '#/constants/exception';
import { updateMusic } from '@/db/music';
import { AllowUpdateKey, YEAR_MAX, YEAR_MIN } from '#/constants/music';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { MusicProperty } from '@/constants/db_definition';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < YEAR_MIN ||
    value > YEAR_MAX
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  if (music.year === value) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }

  await Promise.all([
    updateMusic({
      id: music.id,
      property: MusicProperty.YEAR,
      value,
    }),
    saveMusicModifyRecord({
      musicId: music.id,
      modifyUserId: ctx.user.id,
      key: AllowUpdateKey.YEAR,
    }),
  ]);

  return ctx.success(null);
};
