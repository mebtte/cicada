import { useCallback, useEffect, useState } from 'react';
import { DownloadingMusic, DownloadStatus } from './constants';
import eventemitter, { EventType } from '../eventemitter';
import generateRandomString from '#/utils/generate_random_string';
import { logger } from 'workbox-core/_private';
import formatMusicFilename from '#/utils/format_music_filename';

async function downloadAndSave(downloadingMusic: DownloadingMusic) {
  const { music, directoryHandle } = downloadingMusic;
  const fileHandle = await directoryHandle.getFileHandle(
    formatMusicFilename({
      name: music.name,
      singerNames: music.singers.map((s) => s.name),
      ext: music.asset.split('.').at(-1)!,
    }),
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
  const cleanAll = useCallback(() => setDownloadingMusicList([]), []);
  const cleanSuccessful = useCallback(
    () =>
      setDownloadingMusicList((dml) =>
        dml.filter((m) => m.status !== DownloadStatus.SUCCESSFUL),
      ),
    [],
  );
  const retryFailed = useCallback(
    () =>
      setDownloadingMusicList((dml) =>
        dml.map((m) =>
          m.status === DownloadStatus.FAILED
            ? {
                ...m,
                status: DownloadStatus.WAITING,
              }
            : m,
        ),
      ),
    [],
  );

  useEffect(
    () =>
      eventemitter.listen(EventType.DOWNLOAD_MUSIC_LIST, (payload) =>
        setDownloadingMusicList((dml) => {
          const existingMusicIds = dml.map(({ music }) => music.id);
          return [
            ...payload.musicList
              .filter((m) => !existingMusicIds.includes(m.id))
              .map(
                (music) =>
                  ({
                    id: generateRandomString(),
                    music,
                    directoryHandle: payload.directoryHandle,
                    status: DownloadStatus.WAITING,
                  } satisfies DownloadingMusic),
              ),
            ...dml,
          ];
        }),
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
    const waiting = downloadingMusicList.findLast(
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

  return { downloadingMusicList, cleanAll, cleanSuccessful, retryFailed };
}

export default useDownload;
