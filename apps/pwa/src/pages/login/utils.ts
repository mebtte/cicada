import { t } from '@/i18n';

type NormalizeServerOriginResult =
  | {
      ok: true;
      origin: string;
    }
  | {
      ok: false;
      origin: string;
      error: string;
    };

function isLocalServerHost(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();
  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname.endsWith('.localhost') ||
    normalizedHostname === '::1' ||
    normalizedHostname === '[::1]' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname.startsWith('127.')
  );
}

export function getServerOriginKey(origin: string) {
  const value = origin.trim();
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

export function normalizeServerOriginInput(
  origin: string,
): NormalizeServerOriginResult {
  const value = origin.trim();
  if (!value) {
    return {
      ok: false,
      origin: value,
      error: t('empty_origin_warning'),
    };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return {
      ok: false,
      origin: value,
      error: t('origin_is_invalid'),
    };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return {
      ok: false,
      origin: value,
      error: t('origin_protocol_is_invalid'),
    };
  }

  if (
    globalThis.location?.protocol === 'https:' &&
    url.protocol === 'http:' &&
    !isLocalServerHost(url.hostname)
  ) {
    return {
      ok: false,
      origin: value,
      error: t('origin_mixed_content_warning'),
    };
  }

  return {
    ok: true,
    origin: url.origin,
  };
}

export function getServerMetadataErrorMessage(error: unknown) {
  const reason = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : '';

  return reason
    ? `${t('failed_to_get_server_metadata')}: ${reason}`
    : t('failed_to_get_server_metadata');
}
