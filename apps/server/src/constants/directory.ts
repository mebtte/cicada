import { AssetType, TRASH_FILENAME } from '#/constants';
import config from '@/config';
import { TemporaryType } from '.';

export const ROOT_ASSET_DIR = `${config.base}/assets`;
export const ASSET_DIR: Record<AssetType, string> = {
  [AssetType.USER_AVATAR]: `${ROOT_ASSET_DIR}/${AssetType.USER_AVATAR}`,
  [AssetType.SINGER_AVATAR]: `${ROOT_ASSET_DIR}/${AssetType.SINGER_AVATAR}`,
  [AssetType.MUSIC_COVER]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_COVER}`,
  [AssetType.MUSIC_SQ]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_SQ}`,
  [AssetType.MUSIC_HQ]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_HQ}`,
  [AssetType.MUSIC_AC]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_AC}`,
  [AssetType.MUSICBILL_COVER]: `${ROOT_ASSET_DIR}/${AssetType.MUSICBILL_COVER}`,
};

export const DB_SNAPSHOT_DIR = `${config.base}/db_snapshots`;

export const TRASH_DIR = `${config.base}/${TRASH_FILENAME}`;

export const LOG_DIR = `${config.base}/logs`;

export const ROOT_TEMPORARY_DIR = `${config.base}/temporary`;
export const TEMPORARY_DIR: Record<TemporaryType, string> = {
  [TemporaryType.MUSICBILL_EXPORT]: `${ROOT_TEMPORARY_DIR}/${TemporaryType.MUSICBILL_EXPORT}`,
};

export const SECRET_DIR = `${config.base}/secrets`;
