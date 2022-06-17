import { AssetType } from '#/constants';
import argv from '@/argv';

export const ROOT_ASSET_DIR = `${argv.base}/assets`;
export const ASSET_DIR: Record<AssetType, string> = {
  [AssetType.USER_AVATAR]: `${ROOT_ASSET_DIR}/${AssetType.USER_AVATAR}`,
  [AssetType.CHARACTER_AVATAR]: `${ROOT_ASSET_DIR}/${AssetType.CHARACTER_AVATAR}`,
  [AssetType.MUSIC_COVER]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_COVER}`,
  [AssetType.MUSIC_SQ]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_SQ}`,
  [AssetType.MUSIC_HQ]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_HQ}`,
  [AssetType.MUSIC_AC]: `${ROOT_ASSET_DIR}/${AssetType.MUSIC_AC}`,
  [AssetType.MUSICBILL_COVER]: `${ROOT_ASSET_DIR}/${AssetType.MUSICBILL_COVER}`,
};

export const DB_LOG_DIR = `${argv.base}/db_logs`;
export const DB_SNAPSHOT_DIR = `${argv.base}/db_snapshots`;

export const SCHEDULE_LOG_DIR = `${argv.base}/schedule_logs`;

export const ERROR_LOG_DIR = `${argv.base}/error_logs`;

export const ASSET_LOG_DIR = `${argv.base}/asset_logs`;

export const DELETED_MUSICBILL_DIR = `${argv.base}/deleted_musicbills`;

export const TRASH_DIR = `${argv.base}/trash`;
