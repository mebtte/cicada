import argv from '@/argv';
import { AssetType, ASSET_TYPE_MAP } from '@/platform/asset';

const ASSET_DIR_ROOT = `${argv.base}/assets`;
export const ASSET_DIR = {
  ROOT: ASSET_DIR_ROOT,
  USER_AVATAR: `${ASSET_DIR_ROOT}/${
    ASSET_TYPE_MAP[AssetType.USER_AVATAR].directoryName
  }`,
  CHARACTER_AVATAR: `${ASSET_DIR_ROOT}/character_avatar`,
  MUSIC_COVER: `${ASSET_DIR_ROOT}/music_cover`,
  MUSIC_SQ: `${ASSET_DIR_ROOT}/music_sq`,
  MUSIC_HQ: `${ASSET_DIR_ROOT}/music_hq`,
  MUSIC_AC: `${ASSET_DIR_ROOT}/music_ac`,
  MUSICBILL_COVER: `${ASSET_DIR_ROOT}/musicbill_cover`,
};

export const DB_LOG_DIR = `${argv.base}/db_logs`;
export const DB_SNAPSHOT_DIR = `${argv.base}/db_snapshots`;

export const SCHEDULE_LOG_DIR = `${argv.base}/schedule_logs`;

export const ERROR_LOG_DIR = `${argv.base}/error_logs`;
