import fs from 'fs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_FILE_PATH } from '../constants';

const JWT_SECRET = fs.readFileSync(JWT_SECRET_FILE_PATH).toString();
const JWT_TTL = 1000 * 60 * 60 * 24 * 180;

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
