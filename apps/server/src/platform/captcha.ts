import fs from 'fs';
import argv from '@/argv';
import md5 from 'md5';
import generateRandomString from '#/utils/generate_random_string';
import db from './db';

const CAPTCHA_SALT_FILE_PATH = `${argv.base}/captcha_salt`;

let captchaSalt: string;
if (fs.existsSync(CAPTCHA_SALT_FILE_PATH)) {
  captchaSalt = fs.readFileSync(CAPTCHA_SALT_FILE_PATH).toString();
} else {
  captchaSalt = generateRandomString();
  fs.writeFileSync(CAPTCHA_SALT_FILE_PATH, captchaSalt);
}

export function saveCaptcha({ id, value }: { id: string; value: string }) {
  const encodedValue = md5(value + captchaSalt);
  return new Promise<void>((resolve, reject) =>
    db.run(
      'insert into captcha(id, value, createTimestamp) values(?, ?, ?)',
      [id, encodedValue, Date.now()],
      (error) => (error ? reject(error) : resolve()),
    ),
  );
}
