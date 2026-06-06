import { ExceptionCode } from '@/constants/exception';
import { NAME_MAX_LENGTH as ARTIST_NAME_MAX_LENGTH } from '@/constants/artist';
import createArtistRequest from '@/server/api/create_artist';
import { t } from '@/i18n';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';

export interface CreatedArtist {
  id: string;
  name: string;
  aliases: string[];
}

function openCreateArtistDialog({
  onCreated,
}: {
  onCreated?: (id: string, artist: CreatedArtist) => void | Promise<void>;
} = {}) {
  const createArtist = async ({
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
      const id = await createArtistRequest({ name: trimmedName, force });
      await onCreated?.(id, { id, name: trimmedName, aliases: [] });
    } catch (error) {
      logger.error(error, 'Failed to create artist');
      if (error.code === ExceptionCode.ARTIST_ALREADY_EXISTED) {
        dialog.confirm({
          content: t('repeated_name_artist_warning'),
          onConfirm: () => void createArtist({ name, force: true }),
        });
        return;
      }
      notice.error(error.message);
      return false;
    }
  };

  return dialog.input({
    title: t('create_artist'),
    label: t('name'),
    maxLength: ARTIST_NAME_MAX_LENGTH,
    confirmVariant: 'primary',
    confirmText: t('create'),
    onConfirm: (name) => createArtist({ name }),
  });
}

export default openCreateArtistDialog;
