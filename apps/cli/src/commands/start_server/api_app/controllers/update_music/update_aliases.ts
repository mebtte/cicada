import { ALIAS_DIVIDER } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { AllowUpdateKey, MUSIC_MAX_ALIAS_COUNT } from '#/constants/music';
import { ALIAS_MAX_LENGTH } from '#/constants/singer';
import { MusicProperty } from '@/constants/db_definition';
import { updateMusic } from '@/db/music';
import { saveMusicModifyRecord } from '@/db/music_modify_record';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    !Array.isArray(value) ||
    value.length > MUSIC_MAX_ALIAS_COUNT ||
    value.find((v) => typeof v !== 'string' || v.length > ALIAS_MAX_LENGTH)
  ) {
    return ctx.error(ExceptionCode.WRONG_PARAMETER);
  }

  const trimmedAliases: string[] = value.map((v) =>
    v.replace(/\s+/g, ' ').trim(),
  );
  if (trimmedAliases.find((a) => a.length === 0)) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const aliases = value.join(ALIAS_DIVIDER);
  if (music.aliases === aliases) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }

  await Promise.all([
    updateMusic({
      id: music.id,
      property: MusicProperty.ALIASES,
      value: aliases,
    }),
    saveMusicModifyRecord({
      musicId: music.id,
      modifyUserId: ctx.user.id,
      key: AllowUpdateKey.ALIASES,
    }),
  ]);

  return ctx.success(null);
};
