import { useEffect, useState } from 'react';
import { ExportingMusic, ExportStatus } from './constants';
import eventemitter, { EventType } from './eventemitter';
import generateRandomString from '@/utils/generate_random_string';
import formatMusicFilename from '@/utils/format_music_filename';
import logger from '@/utils/logger';
import timeout from '@/utils/timeout';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import getMusicExportAsset from '@/utils/music_export_asset';

async function exportAndSave(exportingMusic: ExportingMusic) {
  const { music, directoryHandle, asset, ext } = exportingMusic;
  const fileHandle = await directoryHandle.getFileHandle(
    formatMusicFilename({
      name: music.name,
      singerNames: music.singers.map((s) => s.name),
      ext,
    }),
    {
      create: true,
    },
  );
  const writable = await fileHandle.createWritable();
  const response = await globalThis.fetch(asset);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch music asset, status ${response.status}`);
  }
  await response.body.pipeTo(writable);
}

function exportAndSaveWithTimeout(exportingMusic: ExportingMusic) {
  return Promise.race([
    exportAndSave(exportingMusic),
    timeout(1000 * 60 * 5),
  ]);
}

function useExport() {
  const navigate = useNavigate();
  const [exportingMusicList, setExportingMusicList] = useState<
    ExportingMusic[]
  >([]);

  useEffect(
    () =>
      eventemitter.listen(
        EventType.EXPORT_MUSIC_LIST_REMOVE_ITEM,
        (payload) =>
          setExportingMusicList((exportList) =>
            exportList.filter((m) => m.id !== payload.id),
          ),
      ),
    [],
  );

  useEffect(
    () =>
      eventemitter.listen(EventType.EXPORT_MUSIC_LIST, (payload) => {
        setExportingMusicList((exportList) => [
          ...payload.musicList.map(
            (music) => {
              const asset = getMusicExportAsset({
                asset: music.asset,
                quality: payload.quality,
              });
              return {
                id: generateRandomString(),
                music,
                directoryHandle: payload.directoryHandle,
                asset: asset.url,
                ext: asset.ext,
                quality: payload.quality,
                status: ExportStatus.WAITING,
              } satisfies ExportingMusic;
            },
          ),
          ...exportList,
        ]);
        globalThis.setTimeout(() =>
          navigate({
            path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPORTING_MUSIC,
            query: {
              [Query.MUSIC_DRAWER_ID]: '',
            },
          }),
        );
      }),
    [navigate],
  );

  useEffect(
    () =>
      eventemitter.listen(EventType.EXPORT_MUSIC_LIST_RETRY_FAILED, () =>
        setExportingMusicList((exportList) =>
          exportList.map((m) =>
            m.status === ExportStatus.FAILED
              ? {
                  ...m,
                  status: ExportStatus.WAITING,
                }
              : m,
          ),
        ),
      ),
    [],
  );

  useEffect(
    () =>
      eventemitter.listen(
        EventType.EXPORT_MUSIC_LIST_RETRY_ITEM,
        (payload) =>
          setExportingMusicList((exportList) =>
            exportList.map((m) =>
              m.id === payload.id && m.status === ExportStatus.FAILED
                ? {
                    ...m,
                    status: ExportStatus.WAITING,
                  }
                : m,
            ),
          ),
      ),
    [],
  );

  useEffect(() => {
    const exportingList = exportingMusicList.filter(
      (m) => m.status === ExportStatus.EXPORTING,
    );
    if (exportingList.length >= 3) {
      return;
    }
    const waiting = exportingMusicList.findLast(
      (m) => m.status === ExportStatus.WAITING,
    );
    if (waiting) {
      setExportingMusicList((ml) =>
        ml.map((m) =>
          m.id === waiting.id
            ? { ...waiting, status: ExportStatus.EXPORTING }
            : m,
        ),
      );
      exportAndSaveWithTimeout(waiting)
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
          logger.error(error, '导出并保存音乐失败');
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

  return exportingMusicList;
}

export default useExport;
