import { ALIAS_DIVIDER } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import { MUSIC_MAX_ALIAS_COUNT } from '#/constants/music';
import { ALIAS_MAX_LENGTH } from '#/constants/singer';
import { updateMusic, Property } from '@/db/music';
import { Parameter } from './constants';

export default async ({ ctx, music, value }: Parameter) => {
  if (
    !Array.isArray(value) ||
    value.length > MUSIC_MAX_ALIAS_COUNT ||
    value.find((v) => typeof v !== 'string' || v.length > ALIAS_MAX_LENGTH)
  ) {
    return ctx.error(ExceptionCode.PARAMETER_ERROR);
  }

  const aliases = value.join(ALIAS_DIVIDER);
  if (music.aliases === aliases) {
    return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
  }

  await updateMusic({
    id: music.id,
    property: Property.ALIASES,
    value: aliases,
  });

  return ctx.success();
};
