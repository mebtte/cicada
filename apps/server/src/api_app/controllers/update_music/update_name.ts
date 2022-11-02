import { ExceptionCode } from '#/constants/exception';
import { updateMusic, Property as MusicProperty } from '@/db/music';
import { AllowUpdateKey, NAME_MAX_LENGTH } from '#/constants/music';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (typeof value !== 'string') {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const trimmedName = value.replace(/\s+/g, ' ').trim();
  if (!trimmedName.length || trimmedName.length > NAME_MAX_LENGTH) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  if (music.name === trimmedName) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }

  await Promise.all([
    updateMusic({
      id: music.id,
      property: MusicProperty.NAME,
      value: trimmedName,
    }),
    saveMusicModifyRecord({
      musicId: music.id,
      modifyUserId: ctx.user.id,
      key: AllowUpdateKey.NAME,
    }),
  ]);

  return ctx.success();
};
