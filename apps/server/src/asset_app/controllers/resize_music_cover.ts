import fs from 'fs';
import path from 'path';
import { getAssetFilePath } from '@/platform/asset';
import { AssetType } from '#/constants';
import { getMusicById } from '@/db/music';
import { Context } from '@/constants/koa';
import { ExceptionCode } from '#/constants/exception';
import jimp from 'jimp';
import { getCacheDirectory } from '@/config';
import exist from '#/utils/exist';
import definition from '@/definition';
import { MusicProperty } from '@/constants/db_definition';

const MAX_SIZE = 1024;

export default async (ctx: Context) => {
  const { id, size } = ctx.query as { id?: unknown; size?: unknown };
  const sizeNumber = size ? Number(size) : undefined;

  if (
    typeof id !== 'string' ||
    !id.length ||
    typeof sizeNumber !== 'number' ||
    sizeNumber > MAX_SIZE
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const cachePath = path.join(
    getCacheDirectory(),
    `resized_music_cover_${id}_${sizeNumber}.jpeg`,
  );
  const cacheExist = await exist(cachePath);

  if (!cacheExist) {
    const music = await getMusicById(id, [MusicProperty.COVER]);
    if (!music) {
      return ctx.except(ExceptionCode.MUSIC_NOT_EXIST, 404);
    }
    const cover = await jimp.read(
      music.cover
        ? getAssetFilePath(music.cover, AssetType.MUSIC_COVER)
        : path.join(
            __dirname,
            definition.BUILT
              ? './runtime/default_cover.jpeg'
              : '../../../../../runtime/default_cover.jpeg',
          ),
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
