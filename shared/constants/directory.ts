import config from '../config';

const ASSET_DIR_ROOT = `${config.serverBase}/assets`;
export const ASSET_DIR = {
  ROOT: ASSET_DIR_ROOT,
  USER_AVATAR: `${ASSET_DIR_ROOT}/user_avatar`,
};

export const DB_LOG_DIR = `${config.serverBase}/db_logs`;
export const DB_SNAPSHOT_DIR = `${config.serverBase}/db_snapshots`;

export const SCHEDULE_LOG_DIR = `${config.serverBase}/schedule_logs`;
