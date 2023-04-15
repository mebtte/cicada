import fs from 'fs';
import os from 'os';
import spawnAsync from '@expo/spawn-async';
import util from 'util';
import {
  AssetTypeV1,
  ASSET_TYPES_V1,
  ASSET_TYPE_MAP_V1,
  PathPrefix,
} from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import parseFormdata, { File } from '@/utils/parse_formdata';
import which from 'which';
import generateRandomString from '#/utils/generate_random_string';
import fileType from 'file-type';
import md5 from 'md5';
import { getAssetPublicPathV1 } from '@/platform/asset';
import day from '#/utils/day';
import { getAssetDirectory, getLogDirectory } from '@/config';
import { Context } from '../constants';

const appendFileAsync = util.promisify(fs.appendFile);
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const ASSET_TYPE_MAP_OPTION: Record<
  AssetTypeV1,
  {
    handleAsset: (file: File) => Promise<Buffer>;
    generateId: (buffer: Buffer) => string;
  }
> = {
  [AssetTypeV1.SINGER_AVATAR]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetTypeV1.MUSICBILL_COVER]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetTypeV1.MUSIC_COVER]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetTypeV1.USER_AVATAR]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetTypeV1.MUSIC]: {
    handleAsset: async (file) => {
      let ffmpegPath: string;
      try {
        ffmpegPath = await which('ffmpeg');
      } catch (error) {
        ffmpegPath = '';
      }
      if (ffmpegPath) {
        const targetPath = `${os.tmpdir()}/${generateRandomString(
          10,
          false,
        )}.m4a`;
        await spawnAsync(ffmpegPath, [
          '-y',
          '-i',
          file.path,

          // 移除封面和其他元数据
          '-map_metadata',
          '-1',
          '-q',
          '1',

          '-map',
          'a',

          // 码率
          '-ab',
          '192000',

          targetPath,
        ]);
        return readFileAsync(targetPath);
      }
      return readFileAsync(file.path);
    },
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.m4a`;
    },
  },
};

export default async (ctx: Context) => {
  const { field, file } = await parseFormdata<'assetType', 'asset'>(ctx.req);
  // @ts-expect-error
  const assetType: AssetTypeV1 | undefined = field.assetType
    ? field.assetType[0]
    : undefined;
  const asset = file.asset ? file.asset[0] : undefined;
  if (!assetType || !ASSET_TYPES_V1.includes(assetType) || !asset) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const { maxSize, acceptTypes } = ASSET_TYPE_MAP_V1[assetType];
  if (asset.size > maxSize) {
    return ctx.except(ExceptionCode.ASSET_OVER_MAX_SIZE);
  }
  const ft = await fileType.fromFile(asset.path);
  if (!ft || !acceptTypes.includes(ft.mime)) {
    return ctx.except(ExceptionCode.WRONG_ASSET_ACCEPT_TYPES);
  }

  const { handleAsset, generateId } = ASSET_TYPE_MAP_OPTION[assetType];
  const data = await handleAsset(asset);
  const id = generateId(data);

  await writeFileAsync(`${getAssetDirectory(assetType)}/${id}`, data);
  const assetPath = `${PathPrefix.ASSET}/${assetType}/${id}`;

  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');
  appendFileAsync(
    `${getLogDirectory()}/asset_upload_${dateString}.log`,
    `[${timeString}] ${ctx.user.id} ${assetPath}\n`,
  ).catch((e) => console.error(e));

  return ctx.success({
    id,
    path: assetPath,
    url: getAssetPublicPathV1(id, assetType),
  });
};
