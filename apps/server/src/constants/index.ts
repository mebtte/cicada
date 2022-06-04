import argv from '@/argv';

export const ASSET_PREFIX = 'asset';

export const LOGIN_CODE_SALT_FILE_PATH = `${argv.base}/login_code_salt`;
export const JWT_SECRET_FILE_PATH = `${argv.base}/jwt_secret`;
export const DB_FILE_PATH = `${argv.base}/db`;

/** 登录验证码有效时间 */
export const LOGIN_CODE_TTL = 1000 * 60 * 10;
