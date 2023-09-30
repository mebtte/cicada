import { Language } from '#/constants';
import { t } from '@/i18n';
import * as OTPAuth from 'otpauth';
import capitalize from '#/utils/capitalize';
import { Mode, getConfig } from '@/config';

const ALGORITHM = 'SHA1';
const PERIOD = 30;

export const DIGITS = 6;

export function createSecret() {
  return new OTPAuth.Secret().base32;
}

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
    issuer:
      capitalize(t('cicada', language)) +
      (getConfig().mode === Mode.DEVELOPMENT ? '_DEV' : ''),
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
