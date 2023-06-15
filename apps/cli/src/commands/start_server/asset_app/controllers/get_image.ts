import { AssetType, IMAGE_MAX_SIZE } from '#/constants';
import { getAssetDirectory, getCacheDirectory } from '@/config';
import exist from '#/utils/exist';
import jimp from 'jimp';
import { getAssetFilePath } from '@/platform/asset';
import send from 'koa-send';
import fsPromises from 'fs/promises';
import fs from 'fs';
import { Context } from '../constants';

async function getCover(
  ctx: Context,
  {
    type,
  }: {
    type:
      | AssetType.MUSICBILL_COVER
      | AssetType.MUSIC_COVER
      | AssetType.SINGER_AVATAR
      | AssetType.USER_AVATAR;
  },
) {
  const { asset } = ctx.params as { asset: string };
  const { size } = ctx.query as { size?: unknown };
  const sizeNumber = size ? Number(size) : undefined;

  if (sizeNumber && sizeNumber <= IMAGE_MAX_SIZE) {
    const cacheName = `${sizeNumber}_${asset}`;
    const cachePath = `${getCacheDirectory()}/${cacheName}`;
    const cacheExist = await exist(cachePath);
    const assetPath = getAssetFilePath(asset, type);
    if (!cacheExist) {
      const cover = await jimp.read(assetPath);
      /**
       * 如果图片本身尺寸小于需要的尺寸
       * 直接写入缓存
       * @author mebtte<hi@mebtte.com>
       */
      if (cover.bitmap.width > sizeNumber) {
        await new Promise<void>((resolve, reject) =>
          cover
            .resize(sizeNumber, sizeNumber)
            .quality(80)
            .write(cachePath, (error) => (error ? reject(error) : resolve())),
        );
      } else {
        await fsPromises.writeFile(cachePath, fs.createReadStream(assetPath));
      }
    }
    return send(ctx, cacheName, {
      immutable: true,
      root: getCacheDirectory(),
    });
  }

  return send(ctx, asset, {
    immutable: true,
    root: getAssetDirectory(type),
  });
}

export default getCover;
