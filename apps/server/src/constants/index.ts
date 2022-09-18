import config from '@/config';
import { DB_FILENAME } from '#/constants';

export const DB_FILE_PATH = `${config.base}/${DB_FILENAME}`;

/** 登录验证码有效时间 */
export const LOGIN_CODE_TTL = 1000 * 60 * 10;

export enum TemporaryType {
  MUSICBILL_EXPORT = 'musicbill_exports',
}
