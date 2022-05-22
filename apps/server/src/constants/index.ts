import argv from '@/argv';

export const DB_FILE_PATH = `${argv.base}/db`;

/** 登录验证码有效时间 */
export const LOGIN_CODE_TTL = 1000 * 60 * 10;

export const JWT_TTL = 1000 * 60 * 60 * 24 * 180;
