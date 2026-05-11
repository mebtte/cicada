import { saveAs } from 'file-saver';
import { t } from '@/i18n';
import { ENABLE_FILE_SYSTEM } from '@/constants/browser';
import dialog from '@/utils/dialog';
import formatMusicFilename from '@/utils/format_music_filename';
import getMusicDownloadAsset, {
  MusicDownloadQuality,
} from '@/utils/music_download_asset';
import { Music } from './constants';
import { downloadMusicListByFileSystem } from './utils';

const EXPORT_DIALOG_CLOSE_DELAY = 260;

function downloadMusicByFileSaver(
  music: Music,
  quality: MusicDownloadQuality,
) {
  const asset = getMusicDownloadAsset({
    asset: music.asset,
    quality,
  });
  saveAs(
    asset.url,
    formatMusicFilename({
      name: music.name,
      singerNames: music.singers.map((s) => s.name),
      ext: asset.ext,
    }),
  );
}

export function openDownloadMusicListDialog(musicList: Music[]) {
  if (musicList.length === 0) {
    return;
  }

  const exportMusicList = (quality: MusicDownloadQuality) => {
    if (ENABLE_FILE_SYSTEM) {
      return downloadMusicListByFileSystem(musicList, quality);
    }

    for (const music of musicList) {
      downloadMusicByFileSaver(music, quality);
    }
  };

  let dialogId = '';
  const closeThenExport = (quality: MusicDownloadQuality) => {
    dialog.close(dialogId);
    window.setTimeout(
      () => exportMusicList(quality),
      EXPORT_DIALOG_CLOSE_DELAY,
    );
    return false;
  };

  dialogId = dialog.actions({
    title: t('music_download_quality'),
    actions: [
      {
        text: t('music_download_quality_original'),
        variant: 'primary',
        onClick: () => closeThenExport(MusicDownloadQuality.ORIGINAL),
      },
      {
        text: t('music_playback_quality_smooth'),
        variant: 'secondary',
        onClick: () => closeThenExport(MusicDownloadQuality.SMOOTH),
      },
    ],
  });
}
