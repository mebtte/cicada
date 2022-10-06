import config from '@/config';

export const DB_FILE_PATH = `${config.base}/db`;

/** 登录验证码有效时间 */
export const LOGIN_CODE_TTL = 1000 * 60 * 10;

export enum PathPrefix {
  BLOB = 'blob',
  DOWNLOAD = 'download',
  ASSET = 'asset',
  API = 'api',
}
