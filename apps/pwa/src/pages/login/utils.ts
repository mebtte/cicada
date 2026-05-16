import { t } from '@/i18n';

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
