import fs from 'fs';
import argv from '@/argv';
import md5 from 'md5';
import generateRandomString from '#/utils/generate_random_string';
import { CAPTCHA_TTL } from '#/constants';
import env from '@/env';
import * as db from './db';

const CAPTCHA_SALT_FILE_PATH = `${argv.base}/captcha_salt`;

let captchaSalt: string;
if (fs.existsSync(CAPTCHA_SALT_FILE_PATH)) {
  captchaSalt = fs.readFileSync(CAPTCHA_SALT_FILE_PATH).toString();
} else {
  captchaSalt = generateRandomString();
  fs.writeFileSync(CAPTCHA_SALT_FILE_PATH, captchaSalt);
}

export function saveCaptcha({ id, value }: { id: string; value: string }) {
  const encodedValue =
    env.RUNENV === 'development'
      ? value.toLowerCase()
      : md5(value.toLowerCase() + captchaSalt);
  return db.run(
    'insert into captcha(id, value, createTimestamp) values(?, ?, ?)',
    [id, encodedValue, Date.now()],
  );
}

export async function verifyCaptcha({
  id,
  value,
}: {
  id: string;
  value: string;
}): Promise<boolean> {
  const captcha = await db.get<{
    id: string;
    value: string;
  }>(
    `
    select
      id,
      value
    from captcha
      where id = ?
        and createTimestamp >= ?
        and used = 0;
  `,
    [id, Date.now() - CAPTCHA_TTL],
  );

  if (!captcha) {
    return false;
  }

  if (
    (env.RUNENV === 'development'
      ? value.toLowerCase()
      : md5(value.toLowerCase() + captchaSalt)) !== captcha.value
  ) {
    return false;
  }

  db.run('update captcha set used = 1 where id = ?', [id]).catch((error) =>
    console.error(error),
  );

  return true;
}
