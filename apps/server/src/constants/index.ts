import argv from '@/argv';
import { DB_FILENAME } from '#/constants';

export const ASSET_PREFIX = 'asset';
export const TEMPORARY_PREFIX = 'temporary';

export const DB_FILE_PATH = `${argv.base}/${DB_FILENAME}`;

/** 登录验证码有效时间 */
export const LOGIN_CODE_TTL = 1000 * 60 * 10;

export enum TemporaryType {
  MUSICBILL_EXPORT = 'musicbill_exports',
}
