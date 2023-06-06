import fs from 'fs';
import md5 from 'md5';
import { GET_LOGIN_CODE_INTERVAL } from '#/constants';
import { getDB } from '@/db';
import generateRandomString from '#/utils/generate_random_string';
import { getLoginCodeSaltFilePath } from '@/config';
import {
  LOGIN_CODE_TABLE_NAME,
  LoginCodeProperty,
  LoginCode,
} from '@/constants/db_definition';
import { LOGIN_CODE_TTL } from '../constants';

let loginCodeSalt: string;
const getLoginCodeSalt = () => {
  if (!loginCodeSalt) {
    if (fs.existsSync(getLoginCodeSaltFilePath())) {
      fs.readFileSync(getLoginCodeSaltFilePath()).toString();
    } else {
      loginCodeSalt = generateRandomString();
      fs.writeFileSync(getLoginCodeSaltFilePath(), loginCodeSalt);
    }
  }
  return loginCodeSalt;
};

export async function hasLoginCodeInGetInterval({
  userId,
}: {
  userId: string;
}) {
  const row = await getDB().get<{ id: string }>(
    `
      SELECT
        ${LoginCodeProperty.ID}
      FROM ${LOGIN_CODE_TABLE_NAME}
      WHERE ${LoginCodeProperty.USER_ID} = ?
        AND ${LoginCodeProperty.CREATE_TIMESTAMP} >= ?
        AND ${LoginCodeProperty.USED} = 0
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
  const encodedCode = md5(code + getLoginCodeSalt());
  return getDB().run(
    `
      INSERT INTO ${LOGIN_CODE_TABLE_NAME} ( ${LoginCodeProperty.USER_ID}, ${LoginCodeProperty.CODE}, ${LoginCodeProperty.CREATE_TIMESTAMP} )
      VALUES ( ?, ?, ? )
    `,
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
  const loginCode = await getDB().get<
    Pick<LoginCode, LoginCodeProperty.ID | LoginCodeProperty.CODE>
  >(
    `
      SELECT
        ${LoginCodeProperty.ID},
        ${LoginCodeProperty.CODE}
      FROM ${LOGIN_CODE_TABLE_NAME}
      WHERE ${LoginCodeProperty.USER_ID} = ?
        AND ${LoginCodeProperty.CREATE_TIMESTAMP} >= ?
        AND ${LoginCodeProperty.USED} = 0
      ORDER BY ${LoginCodeProperty.CREATE_TIMESTAMP} DESC
    `,
    [userId, Date.now() - LOGIN_CODE_TTL],
  );

  if (!loginCode) {
    return false;
  }

  if (loginCode.code !== md5(code + getLoginCodeSalt())) {
    return false;
  }

  getDB()
    .run(
      `
        UPDATE ${LOGIN_CODE_TABLE_NAME} SET ${LoginCodeProperty.USED} = 1
        WHERE ${LoginCodeProperty.ID} = ?
      `,
      [loginCode.id],
    )
    .catch((error) => console.error(error));
  return true;
}
