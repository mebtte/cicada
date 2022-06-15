import argv from '@/argv';
import { JWT_SECRET_FILENAME } from '#/constants';

export const ASSET_PREFIX = 'asset';

export const LOGIN_CODE_SALT_FILE_PATH = `${argv.base}/login_code_salt`;
export const JWT_SECRET_FILE_PATH = `${argv.base}/${JWT_SECRET_FILENAME}`;
export const DB_FILE_PATH = `${argv.base}/db`;

/** 登录验证码有效时间 */
export const LOGIN_CODE_TTL = 1000 * 60 * 10;
