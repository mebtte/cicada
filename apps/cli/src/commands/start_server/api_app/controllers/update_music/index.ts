import { ExceptionCode } from '#/constants/exception';
import { AllowUpdateKey } from '#/constants/music';
import { getMusicById } from '@/db/music';
import { MusicProperty } from '@/constants/db_definition';
import { Context } from '../../constants';
import { Music, Parameter } from './constants';
import updateCover from './update_cover';
import updateName from './update_name';
import updateLyric from './update_lyric';
import updateAliases from './update_aliases';
import updateAsset from './update_asset';
import updateSinger from './update_singer';
import updateForkFrom from './update_fork_from';
import updateYear from './update_year';

const KEY_MAP_HANDLER: Record<AllowUpdateKey, (p: Parameter) => Promise<void>> =
  {
    [AllowUpdateKey.COVER]: updateCover,
    [AllowUpdateKey.NAME]: updateName,
    [AllowUpdateKey.LYRIC]: updateLyric,
    [AllowUpdateKey.ALIASES]: updateAliases,
    [AllowUpdateKey.ASSET]: updateAsset,
    [AllowUpdateKey.SINGER]: updateSinger,
    [AllowUpdateKey.FORK_FROM]: updateForkFrom,
    [AllowUpdateKey.YEAR]: updateYear,
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
    MusicProperty.NAME,
    MusicProperty.CREATE_USER_ID,
    MusicProperty.ALIASES,
    MusicProperty.TYPE,
    MusicProperty.ASSET,
    MusicProperty.YEAR,
  ]);
  if (!music || (!ctx.user.admin && music.createUserId !== ctx.user.id)) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXISTED);
  }

  await KEY_MAP_HANDLER[key as AllowUpdateKey]({ ctx, music, value });
};
