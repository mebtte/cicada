import fs from 'fs';
import path from 'path';
import { getAssetFilePath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { getMusicById, Property as MusicProperty } from '@/db/music';
import { Context } from '@/constants/koa';
import { ExceptionCode } from '#/constants/exception';
import jimp from 'jimp';
import { getCacheDirectory } from '@/config';
import exist from '#/utils/exist';

const SIZES = [96, 128, 192, 256, 384, 512];

export default async (ctx: Context) => {
  const { id, size } = ctx.query as { id?: unknown; size?: unknown };
  const sizeNumber = size ? Number(size) : undefined;

  if (
    typeof id !== 'string' ||
    !id.length ||
    typeof sizeNumber !== 'number' ||
    !SIZES.includes(sizeNumber)
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const music = await getMusicById(id, [MusicProperty.COVER]);
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }
  if (!music.cover) {
    return ctx.except(ExceptionCode.MUSIC_COVER_NOT_EXIST);
  }

  const cachePath = path.join(
    getCacheDirectory(),
    `resized_music_cover_${sizeNumber}_${music.cover}`,
  );
  const cacheExist = await exist(cachePath);
  if (!cacheExist) {
    const cover = await jimp.read(
      getAssetFilePath(music.cover, AssetType.MUSIC_COVER),
    );
    await new Promise<void>((resolve, reject) =>
      cover
        .resize(sizeNumber, sizeNumber)
        .quality(80)
        .write(cachePath, (error) => (error ? reject(error) : resolve())),
    );
  }

  ctx.type = 'image/jpeg';
  ctx.body = fs.createReadStream(cachePath);
};
