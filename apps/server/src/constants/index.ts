import argv from '@/argv';
import { DB_FILENAME, JWT_SECRET_FILENAME } from '#/constants';

export const ASSET_PREFIX = 'asset';
export const DOWNLOAD_PREFIX = 'download';

export const LOGIN_CODE_SALT_FILE_PATH = `${argv.base}/login_code_salt`;
export const JWT_SECRET_FILE_PATH = `${argv.base}/${JWT_SECRET_FILENAME}`;
export const DB_FILE_PATH = `${argv.base}/${DB_FILENAME}`;

/** 登录验证码有效时间 */
export const LOGIN_CODE_TTL = 1000 * 60 * 10;

export enum DownloadType {
  MUSICBILL_EXPORT = 'musicbill_exports',
}
