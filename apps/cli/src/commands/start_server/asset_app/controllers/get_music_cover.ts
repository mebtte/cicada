import { getAssetFilePath } from '@/platform/asset';
import { AssetType, IMAGE_MAX_SIZE } from '#/constants';
import jimp from 'jimp';
import { getAssetDirectory, getCacheDirectory } from '@/config';
import exist from '#/utils/exist';
import send from 'koa-send';
import { Context } from 'koa';

export default async (ctx: Context) => {
  const { asset } = ctx.params as { asset: string };
  const { size } = ctx.query as { size?: unknown };
  const sizeNumber = size ? Number(size) : undefined;

  if (sizeNumber && sizeNumber <= IMAGE_MAX_SIZE) {
    const cacheName = `${sizeNumber}_${asset}`;
    const cachePath = `${getCacheDirectory()}/${cacheName}`;
    const cacheExist = await exist(cachePath);
    if (!cacheExist) {
      const cover = await jimp.read(
        getAssetFilePath(asset, AssetType.MUSIC_COVER),
      );
      await new Promise<void>((resolve, reject) =>
        cover
          .resize(sizeNumber, sizeNumber)
          .quality(80)
          .write(cachePath, (error) => (error ? reject(error) : resolve())),
      );
    }
    return send(ctx, cacheName, {
      immutable: true,
      root: getCacheDirectory(),
    });
  }

  return send(ctx, asset, {
    immutable: true,
    root: getAssetDirectory(AssetType.MUSIC_COVER),
  });
};
