import fs from 'fs';
import md5 from 'md5';
import env from '@/env';
import { GET_LOGIN_CODE_INTERVAL } from '#/constants';
import db from '@/db';
import { LOGIN_CODE_SALT_FILE_PATH, LOGIN_CODE_TTL } from '../constants';

const LOGIN_CODE_SALT = fs.readFileSync(LOGIN_CODE_SALT_FILE_PATH).toString();

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
    env.RUN_ENV === 'development' ? code : md5(code + LOGIN_CODE_SALT);
  return db.run(
    'insert into login_code(userId, code, createTimestamp) values(?, ?, ?)',
    [userId, encodedCode, Date.now()],
  );
}

export async function verifyLoginCode({
  userId,
  code,
}: {
  userId: string;
  code: string;
}): Promise<boolean> {
  const loginCode = await db.get<{ id: string; code: string }>(
    `
      select id, code from login_code
        where userId = ?
          and createTimestamp >= ?
          and used = 0
        order by createTimestamp DESC
    `,
    [userId, Date.now() - LOGIN_CODE_TTL],
  );

  if (!loginCode) {
    return false;
  }

  if (
    loginCode.code !==
    (env.RUN_ENV === 'development' ? code : md5(code + LOGIN_CODE_SALT))
  ) {
    return false;
  }

  db.run('update login_code set used = 1 where id = ?', [loginCode.id]).catch(
    (error) => console.error(error),
  );
  return true;
}
