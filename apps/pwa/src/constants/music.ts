import { MusicType } from '#/constants/music';
import { t } from '@/i18n';

export const MUSIC_TYPE_MAP: Record<MusicType, { label: string }> = {
  [MusicType.SONG]: { label: t('music_type_song') },
  [MusicType.INSTRUMENTAL]: { label: t('music_type_instrument') },
};
