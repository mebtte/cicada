import fs from 'fs';
import os from 'os';
import spawnAsync from '@expo/spawn-async';
import util from 'util';
import {
  AssetType,
  ASSET_TYPES,
  ASSET_TYPE_MAP,
  PathPrefix,
} from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import parseFormdata, { File } from '@/utils/parse_formdata';
import ffmpeg from 'ffmpeg-static';
import generateRandomString from '#/utils/generate_random_string';
import fileType from 'file-type';
import md5 from 'md5';
import { getAssetUrl } from '@/platform/asset';
import { ASSET_DIR, LOG_DIR } from '@/constants/directory';
import day from '#/utils/day';
import { Context } from '../constants';

const appendFileAsync = util.promisify(fs.appendFile);
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const ASSET_TYPE_MAP_OPTION: Record<
  AssetType,
  {
    handleAsset: (file: File) => Promise<Buffer>;
    generateId: (buffer: Buffer) => string;
  }
> = {
  [AssetType.SINGER_AVATAR]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetType.MUSICBILL_COVER]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetType.MUSIC_COVER]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetType.USER_AVATAR]: {
    handleAsset: (file) => readFileAsync(file.path),
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.jpeg`;
    },
  },
  [AssetType.MUSIC_AC]: {
    handleAsset: async (file) => {
      const targetPath = `${os.tmpdir()}/${generateRandomString(
        10,
        false,
      )}.m4a`;
      await spawnAsync(ffmpeg, [
        '-y',
        '-i',
        file.path,
        '-map_metadata',
        '-1',
        targetPath,
      ]);
      return readFileAsync(targetPath);
    },
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.m4a`;
    },
  },
  [AssetType.MUSIC_SQ]: {
    handleAsset: async (file) => {
      const targetPath = `${os.tmpdir()}/${generateRandomString(
        10,
        false,
      )}.m4a`;
      await spawnAsync(ffmpeg, [
        '-y',
        '-i',
        file.path,
        '-map_metadata',
        '-1',
        targetPath,
      ]);
      return readFileAsync(targetPath);
    },
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.m4a`;
    },
  },
  [AssetType.MUSIC_HQ]: {
    handleAsset: async (file) => {
      const targetPath = `${os.tmpdir()}/${generateRandomString(
        10,
        false,
      )}.flac`;
      await spawnAsync(ffmpeg, [
        '-y',
        '-i',
        file.path,
        '-map_metadata',
        '-1',
        targetPath,
      ]);
      return readFileAsync(targetPath);
    },
    generateId: (buffer) => {
      const hash = md5(buffer);
      return `${hash}.flac`;
    },
  },
};

export default async (ctx: Context) => {
  const { field, file } = await parseFormdata<'assetType', 'asset'>(ctx.req);
  // @ts-expect-error
  const assetType: AssetType | undefined = field.assetType
    ? field.assetType[0]
    : undefined;
  const asset = file.asset ? file.asset[0] : undefined;
  if (!assetType || !ASSET_TYPES.includes(assetType) || !asset) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const { maxSize, acceptTypes } = ASSET_TYPE_MAP[assetType];
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

  await writeFileAsync(`${ASSET_DIR[assetType]}/${id}`, data);
  const assetPath = `${PathPrefix.ASSET}/${assetType}/${id}`;

  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');
  appendFileAsync(
    `${LOG_DIR}/asset_upload_${dateString}.log`,
    `[${timeString}] ${ctx.user.id} ${assetPath}\n`,
  ).catch((e) => console.error(e));

  return ctx.success({
    id,
    path: assetPath,
    url: getAssetUrl(id, assetType),
  });
};
