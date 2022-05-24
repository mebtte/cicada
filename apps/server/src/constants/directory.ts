import argv from '@/argv';

const ASSET_DIR_ROOT = `${argv.base}/assets`;
export const ASSET_DIR = {
  ROOT: ASSET_DIR_ROOT,
  USER_AVATAR: `${ASSET_DIR_ROOT}/user_avatar`,
  CHARACTER_AVATAR: `${ASSET_DIR_ROOT}/character_avatar`,
};

export const DB_LOG_DIR = `${argv.base}/db_logs`;
export const DB_SNAPSHOT_DIR = `${argv.base}/db_snapshots`;

export const SCHEDULE_LOG_DIR = `${argv.base}/schedule_logs`;

export const ERROR_LOG_DIR = `${argv.base}/error_logs`;
