import fs from 'fs';
import argv from '@/argv';
import generateRandomString from '#/utils/generate_random_string';
import jwt from 'jsonwebtoken';
import { JWT_TTL } from '../constants';

const JWT_SECRET_FILE_PATH = `${argv.base}/jwt_secret`;

let jwtSecret: string;
if (fs.existsSync(JWT_SECRET_FILE_PATH)) {
  jwtSecret = fs.readFileSync(JWT_SECRET_FILE_PATH).toString();
} else {
  jwtSecret = generateRandomString(33);
  fs.writeFileSync(JWT_SECRET_FILE_PATH, jwtSecret);
}

export function sign(userId: string) {
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: JWT_TTL / 1000,
  });
}

export function verify(token: string): string {
  const payload = jwt.verify(token, jwtSecret);
  // @ts-expect-error
  return payload.userId;
}
