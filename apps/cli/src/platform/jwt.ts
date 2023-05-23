import fs from 'fs';
import jwt from 'jsonwebtoken';
import generateRandomString from '#/utils/generate_random_string';
import { getJWTSecretFilePath } from '@/config';

const JWT_TTL = 1000 * 60 * 60 * 24 * 180;

let secret: string = '';
const getSecret = () => {
  if (!secret) {
    if (fs.existsSync(getJWTSecretFilePath())) {
      secret = fs.readFileSync(getJWTSecretFilePath()).toString();
    } else {
      secret = generateRandomString(64);
      fs.writeFileSync(getJWTSecretFilePath(), secret);
    }
  }

  return secret;
};

export function sign(userId: string) {
  return jwt.sign({ userId }, getSecret(), {
    expiresIn: JWT_TTL / 1000,
  });
}

export function verify(token: string): string {
  const payload = jwt.verify(token, getSecret());
  // @ts-expect-error
  return payload.userId;
}
