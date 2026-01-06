import { useEffect, useState } from 'react';
import { DownloadingMusic, DownloadStatus } from './constants';
import eventemitter, { EventType } from '../eventemitter';
import generateRandomString from '#/utils/generate_random_string';
import { logger } from 'workbox-core/_private';
import sanitize from 'sanitize-filename';
import { t } from '@/i18n';

async function downloadAndSave(downloadingMusic: DownloadingMusic) {
  const { music, directoryHandle } = downloadingMusic;
  const fileHandle = await directoryHandle.getFileHandle(
    sanitize(
      `${music.singers.map((s) => s.name).join(',') || t('unknown_singer')} - ${
        music.name
      }.${music.asset.split('.').at(-1)}`,
    ),
    {
      create: true,
    },
  );
  const writable = await fileHandle.createWritable();
  const response = await globalThis.fetch(music.asset);
  await response.body?.pipeTo(writable);
}

function useDownload() {
  const [downloadingMusicList, setDownloadingMusicList] = useState<
    DownloadingMusic[]
  >([]);

  useEffect(
    () =>
      eventemitter.listen(EventType.EXPORT_MUSIC_LIST, (payload) =>
        setDownloadingMusicList((dml) => [
          ...dml,
          ...payload.musicList.map(
            (music) =>
              ({
                id: generateRandomString(),
                music,
                directoryHandle: payload.directoryHandle,
                status: DownloadStatus.WAITING,
              } satisfies DownloadingMusic),
          ),
        ]),
      ),
    [],
  );

  useEffect(() => {
    const downloading = downloadingMusicList.find(
      (m) => m.status === DownloadStatus.DOWNLOADING,
    );
    if (downloading) {
      return;
    }
    const waiting = downloadingMusicList.find(
      (m) => m.status === DownloadStatus.WAITING,
    );
    if (waiting) {
      setDownloadingMusicList((ml) =>
        ml.map((m) =>
          m.id === waiting.id
            ? { ...waiting, status: DownloadStatus.DOWNLOADING }
            : m,
        ),
      );
      downloadAndSave(waiting)
        .then(() =>
          setDownloadingMusicList((ml) =>
            ml.map((m) =>
              m.id === waiting.id
                ? { ...waiting, status: DownloadStatus.SUCCESSFUL }
                : m,
            ),
          ),
        )
        .catch((error) => {
          logger.error(error, '下载并保存音乐失败');
          setDownloadingMusicList((ml) =>
            ml.map((m) =>
              m.id === waiting.id
                ? { ...waiting, status: DownloadStatus.FAILED }
                : m,
            ),
          );
        });
    }
  }, [downloadingMusicList]);

  return downloadingMusicList;
}

export default useDownload;
