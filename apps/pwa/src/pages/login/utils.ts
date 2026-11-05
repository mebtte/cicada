import { t } from '@/i18n';
import {
  normalizeServerBaseURL,
  ServerURLValidationError,
} from '@/utils/server_url';

type NormalizeServerBaseURLResult =
  | {
      ok: true;
      baseURL: string;
    }
  | {
      ok: false;
      baseURL: string;
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

export function normalizeServerBaseURLInput(
  baseURL: string,
): NormalizeServerBaseURLResult {
  const value = baseURL.trim();
  let normalized: string;
  try {
    normalized = normalizeServerBaseURL(value);
  } catch (error) {
    return {
      ok: false,
      baseURL: value,
      error:
        error instanceof ServerURLValidationError && error.reason === 'empty'
          ? t('empty_server_address_warning')
          : error instanceof ServerURLValidationError && error.reason === 'protocol'
            ? t('server_address_protocol_is_invalid')
            : t('server_address_is_invalid'),
    };
  }
  const url = new URL(normalized);
  if (
    globalThis.location?.protocol === 'https:' &&
    url.protocol === 'http:' &&
    !isLocalServerHost(url.hostname)
  ) {
    return {
      ok: false,
      baseURL: value,
      error: t('server_address_mixed_content_warning'),
    };
  }

  return {
    ok: true,
    baseURL: normalized,
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
