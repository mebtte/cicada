import fs from 'fs';
import util from 'util';
import { AssetType, ASSET_TYPES, ASSET_TYPE_MAP } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import parseFormdata from '@/utils/parse_formdata';
import fileType from 'file-type';
import md5 from 'md5';
import { getAssetPublicPath } from '@/platform/asset';
import { getAssetDirectory } from '@/config';
import logger from '@/utils/logger';
import jimp from 'jimp';
import { Context } from '../constants';

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const isSquare = async (buffer: Buffer) => {
  const image = await jimp.read(buffer);
  /**
   * 允许一定的误差
   * @author mebtte<hi@mebtte.com>
   */
  return Math.abs(image.bitmap.width - image.bitmap.height) < 5;
};
const ASSET_TYPE_MAP_OPTION: Record<
  AssetType,
  {
    generateId: (buffer: Buffer, ext: string) => Promise<string>;
    validate?: (buffer: Buffer) => Promise<boolean>;
  }
> = {
  [AssetType.SINGER_AVATAR]: {
    validate: isSquare,
    generateId: async (buffer, ext) => {
      const hash = md5(buffer);
      return `${hash}.${ext}`;
    },
  },
  [AssetType.MUSICBILL_COVER]: {
    validate: isSquare,
    generateId: async (buffer, ext) => {
      const hash = md5(buffer);
      return `${hash}.${ext}`;
    },
  },
  [AssetType.MUSIC_COVER]: {
    validate: isSquare,
    generateId: async (buffer, ext) => {
      const hash = md5(buffer);
      return `${hash}.${ext}`;
    },
  },
  [AssetType.USER_AVATAR]: {
    validate: isSquare,
    generateId: async (buffer, ext) => {
      const hash = md5(buffer);
      return `${hash}.${ext}`;
    },
  },
  [AssetType.MUSIC]: {
    generateId: async (buffer, ext) => {
      const hash = md5(buffer);
      return `${hash}.${ext}`;
    },
  },
};

export default async (ctx: Context) => {
  const { field, file } = await parseFormdata<'assetType', 'asset'>(ctx.req);
  // @ts-expect-error: known type
  const assetType: AssetType | undefined = field.assetType
    ? field.assetType[0]
    : undefined;
  const asset = file.asset ? file.asset[0] : undefined;
  if (!assetType || !ASSET_TYPES.includes(assetType) || !asset) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const { maxSize, acceptType } = ASSET_TYPE_MAP[assetType];
  if (asset.size > maxSize) {
    return ctx.except(ExceptionCode.ASSET_OVERSIZE);
  }
  const ft = await fileType.fromFile(asset.path);
  if (!ft || !new Set(Object.values(acceptType).flat()).has(ft.mime)) {
    return ctx.except(ExceptionCode.WRONG_ASSET_TYPE);
  }

  const { generateId, validate } = ASSET_TYPE_MAP_OPTION[assetType];
  const data = await readFileAsync(asset.path);
  if (validate) {
    const valid = await validate(data);
    if (!valid) {
      return ctx.except(ExceptionCode.WRONG_PARAMETER);
    }
  }
  const id = await generateId(data, ft.ext);

  await writeFileAsync(`${getAssetDirectory(assetType)}/${id}`, data);
  const assetPath = getAssetPublicPath(id, assetType);

  logger.info({
    label: 'asset_upload',
    title: assetType,
    message: `${ctx.user.id}: ${assetPath}`,
  });

  return ctx.success({
    id,
    path: assetPath,
  });
};
