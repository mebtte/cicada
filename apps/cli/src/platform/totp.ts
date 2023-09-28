import { Language } from '#/constants';
import { t } from '@/i18n';
import * as OTPAuth from 'otpauth';

const ALGORITHM = 'SHA1';
const DIGITS = 6;
const PERIOD = 30;

export function create({
  language,
  username,
  secret,
}: {
  language: Language;
  username: string;
  secret: string;
}) {
  const totp = new OTPAuth.TOTP({
    issuer: t('cicada', language),
    label: username,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret,
  });
  return totp.toString();
}

export function validate({ token, secret }: { token: string; secret: string }) {
  const totp = new OTPAuth.TOTP({
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret,
  });
  const delta = totp.validate({ token });
  return delta !== null;
}
