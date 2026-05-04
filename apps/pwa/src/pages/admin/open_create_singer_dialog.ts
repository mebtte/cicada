import { ExceptionCode } from '@/constants/exception';
import { NAME_MAX_LENGTH as SINGER_NAME_MAX_LENGTH } from '@/constants/singer';
import createSingerRequest from '@/server/api/create_singer';
import { t } from '@/i18n';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';

function openCreateSingerDialog({
  onCreated,
}: {
  onCreated?: (id: string) => void | Promise<void>;
} = {}) {
  const createSinger = async ({
    name,
    force = false,
  }: {
    name: string;
    force?: boolean;
  }) => {
    const trimmedName = name.replace(/\s+/g, ' ').trim();
    if (!trimmedName) {
      notice.error(t('empty_name_warning'));
      return false;
    }

    try {
      const id = await createSingerRequest({ name: trimmedName, force });
      await onCreated?.(id);
    } catch (error) {
      logger.error(error, 'Failed to create singer');
      if (error.code === ExceptionCode.SINGER_ALREADY_EXISTED) {
        dialog.confirm({
          content: t('repeated_name_singer_warning'),
          onConfirm: () => void createSinger({ name, force: true }),
        });
        return;
      }
      notice.error(error.message);
      return false;
    }
  };

  return dialog.input({
    title: t('create_singer'),
    label: t('name'),
    maxLength: SINGER_NAME_MAX_LENGTH,
    confirmVariant: 'primary',
    confirmText: t('create'),
    onConfirm: (name) => createSinger({ name }),
  });
}

export default openCreateSingerDialog;
