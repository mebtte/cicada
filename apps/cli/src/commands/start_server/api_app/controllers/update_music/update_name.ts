import { ExceptionCode } from '#/constants/exception';
import { updateMusic } from '@/db/music';
import { AllowUpdateKey, NAME_MAX_LENGTH } from '#/constants/music';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { MusicProperty } from '@/constants/db_definition';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (typeof value !== 'string') {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const trimmedName = value.replace(/\s+/g, ' ').trim();
  if (!trimmedName.length || trimmedName.length > NAME_MAX_LENGTH) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
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

  return ctx.success(null);
};
