import fs from 'fs';
import jwt from 'jsonwebtoken';
import { JWT_TTL } from '#/constants';
import { JWT_SECRET_FILE_PATH } from '../constants';

const JWT_SECRET = fs.readFileSync(JWT_SECRET_FILE_PATH).toString();

export function sign(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_TTL / 1000,
  });
}

export function verify(token: string): string {
  const payload = jwt.verify(token, JWT_SECRET);
  // @ts-expect-error
  return payload.userId;
}
