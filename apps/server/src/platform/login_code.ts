import fs from 'fs';
import argv from '@/argv';
import md5 from 'md5';
import generateRandomString from '#/utils/generate_random_string';
import env from '@/env';
import { GET_LOGIN_CODE_INTERVAL } from '#/constants';
import * as db from './db';

const LOGIN_CODE_SALT_FILE_PATH = `${argv.base}/login_code_salt`;

let loginCodeSalt: string;
if (fs.existsSync(LOGIN_CODE_SALT_FILE_PATH)) {
  loginCodeSalt = fs.readFileSync(LOGIN_CODE_SALT_FILE_PATH).toString();
} else {
  loginCodeSalt = generateRandomString();
  fs.writeFileSync(LOGIN_CODE_SALT_FILE_PATH, loginCodeSalt);
}

export async function hasLoginCodeInGetInterval({
  userId,
}: {
  userId: string;
}) {
  const row = await db.get<{ id: string }>(
    `
    select id from login_code
    where userId = ?
      and createTimestamp >= ?
      and used = 0
  `,
    [userId, Date.now() - GET_LOGIN_CODE_INTERVAL],
  );
  return !!row;
}

export function saveLoginCode({
  userId,
  code,
}: {
  userId: string;
  code: string;
}) {
  const encodedCode =
    env.RUNENV === 'development' ? code : md5(code + loginCodeSalt);
  return db.run(
    'insert into login_code(userId, code, createTimestamp) values(?, ?, ?)',
    [userId, encodedCode, Date.now()],
  );
}
