import fs from 'fs';
import jwt from 'jsonwebtoken';
import generateRandomString from '#/utils/generate_random_string';
import { SECRET_DIR } from '../constants/directory';

const JWT_TTL = 1000 * 60 * 60 * 24 * 180;
const JWT_SECRET_FILE_PATH = `${SECRET_DIR}/jwt_secret`;

let secret: string;
if (fs.existsSync(JWT_SECRET_FILE_PATH)) {
  secret = fs.readFileSync(JWT_SECRET_FILE_PATH).toString();
} else {
  secret = generateRandomString(64);
  fs.writeFileSync(JWT_SECRET_FILE_PATH, secret);
}

export function sign(userId: string) {
  return jwt.sign({ userId }, secret, {
    expiresIn: JWT_TTL / 1000,
  });
}

export function verify(token: string): string {
  const payload = jwt.verify(token, secret);
  // @ts-expect-error
  return payload.userId;
}
