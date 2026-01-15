import { useEffect, useState } from 'react';
import { DownloadingMusic, DownloadStatus } from './constants';
import eventemitter, { EventType } from './eventemitter';
import generateRandomString from '#/utils/generate_random_string';
import formatMusicFilename from '#/utils/format_music_filename';
import logger from '@/utils/logger';
import timeout from '#/utils/timeout';
import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';

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

function downloadAndSaveWithTimeout(downloadingMusic: DownloadingMusic) {
  return Promise.race([
    downloadAndSave(downloadingMusic),
    timeout(1000 * 60 * 5),
  ]);
}

function useDownload() {
  const navigate = useNavigate();
  const [downloadingMusicList, setDownloadingMusicList] = useState<
    DownloadingMusic[]
  >([]);

  useEffect(
    () =>
      eventemitter.listen(EventType.DOWNLOAD_MUSIC_LIST_CLEAN_ALL, () =>
        setDownloadingMusicList([]),
      ),
    [],
  );

  useEffect(
    () =>
      eventemitter.listen(
        EventType.DOWNLOAD_MUSIC_LIST_REMOVE_ITEM,
        (payload) =>
          setDownloadingMusicList((dml) =>
            dml.filter((m) => m.id !== payload.id),
          ),
      ),
    [],
  );

  useEffect(
    () =>
      eventemitter.listen(EventType.DOWNLOAD_MUSIC_LIST, (payload) => {
        setDownloadingMusicList((dml) => [
          ...payload.musicList.map(
            (music) =>
              ({
                id: generateRandomString(),
                music,
                directoryHandle: payload.directoryHandle,
                status: DownloadStatus.WAITING,
              } satisfies DownloadingMusic),
          ),
          ...dml,
        ]);
        globalThis.setTimeout(() =>
          navigate({ path: ROOT_PATH.PLAYER + PLAYER_PATH.DOWNLOADING_MUSIC }),
        );
      }),
    [navigate],
  );

  useEffect(
    () =>
      eventemitter.listen(EventType.DOWNLOAD_MUSIC_LIST_RETRY_FAILED, () =>
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
      ),
    [],
  );

  useEffect(() => {
    const downloadingList = downloadingMusicList.filter(
      (m) => m.status === DownloadStatus.DOWNLOADING,
    );
    if (downloadingList.length >= 3) {
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
      downloadAndSaveWithTimeout(waiting)
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
