import { useEffect, useState } from 'react';
import { ExportingMusic, ExportStatus } from './constants';
import eventemitter, { EventType } from './eventemitter';
import generateRandomString from '#/utils/generate_random_string';
import { logger } from 'workbox-core/_private';
import sanitize from 'sanitize-filename';
import { t } from '@/i18n';

async function downloadAndSave(exportMusic: ExportingMusic) {
  const { music, directoryHandle } = exportMusic;
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

function useExports() {
  const [exportingMusicList, setExportingMusicList] = useState<
    ExportingMusic[]
  >([]);

  useEffect(
    () =>
      eventemitter.listen(EventType.EXPORT_MUSIC_LIST, (payload) =>
        setExportingMusicList(
          payload.musicList.map(
            (music) =>
              ({
                id: generateRandomString(),
                music,
                directoryHandle: payload.directoryHandle,
                status: ExportStatus.WAITING,
              } satisfies ExportingMusic),
          ),
        ),
      ),
    [],
  );

  useEffect(() => {
    const downloading = exportingMusicList.find(
      (m) => m.status === ExportStatus.DOWNLOADING,
    );
    if (downloading) {
      return;
    }
    const waiting = exportingMusicList.find(
      (m) => m.status === ExportStatus.WAITING,
    );
    if (waiting) {
      setExportingMusicList((ml) =>
        ml.map((m) =>
          m.id === waiting.id
            ? { ...waiting, status: ExportStatus.DOWNLOADING }
            : m,
        ),
      );
      downloadAndSave(waiting)
        .then(() =>
          setExportingMusicList((ml) =>
            ml.map((m) =>
              m.id === waiting.id
                ? { ...waiting, status: ExportStatus.SUCCESSFUL }
                : m,
            ),
          ),
        )
        .catch((error) => {
          logger.error(error, '下载并保存音乐失败');
          setExportingMusicList((ml) =>
            ml.map((m) =>
              m.id === waiting.id
                ? { ...waiting, status: ExportStatus.FAILED }
                : m,
            ),
          );
        });
    }
  }, [exportingMusicList]);

  console.log('[mebtte] exportingMusicList', exportingMusicList);
  return exportingMusicList;
}

export default useExports;
