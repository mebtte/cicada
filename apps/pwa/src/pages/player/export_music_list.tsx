import { saveAs } from 'file-saver';
import { t } from '@/i18n';
import { ENABLE_FILE_SYSTEM } from '@/constants/browser';
import dialog from '@/utils/dialog';
import formatMusicFilename from '@/utils/format_music_filename';
import getMusicExportAsset, {
  MusicExportQuality,
} from '@/utils/music_export_asset';
import { Music } from './constants';
import { exportMusicListByFileSystem } from './utils';

const EXPORT_DIALOG_CLOSE_DELAY = 260;

function exportMusicByFileSaver(
  music: Music,
  quality: MusicExportQuality,
) {
  const asset = getMusicExportAsset({
    asset: music.asset,
    quality,
  });
  saveAs(
    asset.url,
    formatMusicFilename({
      name: music.name,
      performerNames: music.performers.map((s) => s.name),
      ext: asset.ext,
    }),
  );
}

export function openExportMusicListDialog(musicList: Music[]) {
  if (musicList.length === 0) {
    return;
  }

  const exportMusicList = (quality: MusicExportQuality) => {
    if (ENABLE_FILE_SYSTEM) {
      return exportMusicListByFileSystem(musicList, quality);
    }

    for (const music of musicList) {
      exportMusicByFileSaver(music, quality);
    }
  };

  let dialogId = '';
  const closeThenExport = (quality: MusicExportQuality) => {
    dialog.close(dialogId);
    window.setTimeout(
      () => exportMusicList(quality),
      EXPORT_DIALOG_CLOSE_DELAY,
    );
    return false;
  };

  dialogId = dialog.actions({
    title: t('music_export_quality'),
    actions: [
      {
        text: t('music_export_quality_original'),
        variant: 'primary',
        onClick: () => closeThenExport(MusicExportQuality.ORIGINAL),
      },
      {
        text: t('music_playback_quality_smooth'),
        variant: 'secondary',
        onClick: () => closeThenExport(MusicExportQuality.SMOOTH),
      },
    ],
  });
}
