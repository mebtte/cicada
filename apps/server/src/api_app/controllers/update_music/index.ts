import { ExceptionCode } from '#/constants/exception';
import { AllowUpdateKey } from '#/constants/music';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import { Context } from '../../constants';
import { Music, Parameter } from './constants';
import updateCover from './update_cover';

const KEY_MAP_HANDLER: Record<AllowUpdateKey, (p: Parameter) => Promise<void>> =
  {
    [AllowUpdateKey.COVER]: updateCover,
  };

export default async (ctx: Context) => {
  const { id, key, value } = ctx.request.body as {
    id?: unknown;
    key?: unknown;
    value?: unknown;
  };

  if (
    typeof id !== 'string' ||
    !id.length ||
    // @ts-expect-error
    !Object.values(AllowUpdateKey).includes(key)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const music: Music | null = await getMusicById(id, [
    MusicProperty.ID,
    MusicProperty.COVER,
  ]);
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }

  await KEY_MAP_HANDLER[key as AllowUpdateKey]({ ctx, music, value });
};
