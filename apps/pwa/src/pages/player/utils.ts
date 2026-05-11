import { NAME_MAX_LENGTH as MUSICBILL_NAME_MAX_LENGTH } from '@/constants/musicbill';
import dialog from '@/utils/dialog';
import createMusicbillRequest from '@/server/api/create_musicbill';
import notice from '@/utils/notice';
import logger from '@/utils/logger';
import { t } from '@/i18n';
import { Music, SingerWithAliases } from './constants';
import e, { EventType } from './eventemitter';
import { MusicDownloadQuality } from '@/utils/music_download_asset';

export function openCreateMusicbillDialog() {
  return dialog.input({
    title: t('create_musicbill'),
    label: t('name'),
    maxLength: MUSICBILL_NAME_MAX_LENGTH,
    confirmVariant: 'primary',
    confirmText: t('create'),
    onConfirm: async (name: string) => {
      const trimmedName = name.replace(/\s+/, ' ').trim();
      if (!trimmedName.length) {
        notice.error(t('empty_name_warning'));
        return false;
      }
      try {
        const id = await createMusicbillRequest(trimmedName);
        e.emit(EventType.MUSICBILL_CREATED, { id });
      } catch (error) {
        logger.error(error, 'Failed to create musicbill');
        notice.error(error.message);
        return false;
      }
    },
  });
}

export function filterMusic(
  music: Omit<Music, 'singers'> & {
    singers: SingerWithAliases[];
  },
  keyword: string,
) {
  if (keyword) {
    const lowerCaseKeyword = keyword.toLowerCase();
    return (
      music.name.toLowerCase().includes(lowerCaseKeyword) ||
      music.aliases.find((a) => a.toLowerCase().includes(lowerCaseKeyword)) ||
      music.singers.find(
        (singer) =>
          singer.name.toLowerCase().includes(lowerCaseKeyword) ||
          singer.aliases.find((alias) =>
            alias.toLowerCase().includes(lowerCaseKeyword),
          ),
      )
    );
  }
  return true;
}

export function formatSecond(s: number) {
  const minute = Math.floor(s / 60);
  const second = Math.floor(s % 60);
  return `${minute < 10 ? '0' : ''}${minute}:${
    second < 10 ? '0' : ''
  }${second}`;
}

export async function downloadMusicListByFileSystem(
  musicList: Music[],
  quality: MusicDownloadQuality,
) {
  try {
    const directoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads',
    });
    e.emit(EventType.DOWNLOAD_MUSIC_LIST, {
      musicList,
      directoryHandle,
      quality,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    logger.error(error, '无法选择保存目录');
    notice.error(error.message);
  }
}
