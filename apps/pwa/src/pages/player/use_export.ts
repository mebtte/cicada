import { useEffect, useState } from 'react';
import { ExportingMusic, ExportStatus } from './constants';
import eventemitter, { EventType } from './eventemitter';
import generateRandomString from '@/utils/generate_random_string';
import formatMusicFilename from '@/utils/format_music_filename';
import getMusicFileMetadata from '@/utils/get_music_file_metadata';
import logger from '@/utils/logger';
import timeout from '@/utils/timeout';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import getMusicExportAsset from '@/utils/music_export_asset';

/* 节流间隔: 每 120ms 才把下载进度推回 React state, 避免 chunk 抖动导致整列表频繁 re-render */
const PROGRESS_REPORT_INTERVAL_MS = 120;

type OnProgress = (loaded: number, total: number | undefined) => void;

/* 由元数据 (codec / bitRate) 拼成最终文件名里的 "{bitrate}.{codec}" 段; 都缺失则返回 undefined, 退回到无 tag 的基础文件名 */
function composeFilenameTag(codec?: string, bitRate?: number) {
  const codecUpper = codec?.toUpperCase();
  const kbps = bitRate ? Math.round(bitRate / 1000) : undefined;
  const parts: string[] = [];
  if (kbps) {
    parts.push(`${kbps}k`);
  }
  if (codecUpper) {
    parts.push(codecUpper);
  }
  return parts.length ? parts.join('.') : undefined;
}

async function exportAndSave(
  exportingMusic: ExportingMusic,
  onProgress: OnProgress,
  signal: AbortSignal,
) {
  const { id, music, directoryHandle, asset, ext } = exportingMusic;
  const singerNames = music.singers.map((s) => s.name);
  const baseFilename = formatMusicFilename({
    name: music.name,
    singerNames,
    ext,
  });
  /* 临时文件: 前缀 . 让 macOS/Linux 的文件管理器默认隐藏; 用 export id 加在中间防止同首歌并发导出冲突; .cicada-part 后缀语义清晰, 即便残留也容易识别清理 */
  const tempFilename = `.${baseFilename}.${id}.cicada-part`;

  /* 走"下载到临时文件 -> 解析元数据 -> 改名为最终文件" 需要 FileSystemFileHandle.move (Chromium 110+), 否则直接失败让该项落 FAILED */
  if (
    typeof (FileSystemFileHandle.prototype as { move?: unknown }).move !==
    'function'
  ) {
    throw new Error('FileSystemFileHandle.move not supported');
  }

  const tempFileHandle = await directoryHandle.getFileHandle(tempFilename, {
    create: true,
  });
  const writable = await tempFileHandle.createWritable();
  let writableClosed = false;
  try {
    const response = await globalThis.fetch(asset, { signal });
    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch music asset, status ${response.status}`);
    }
    /* CDN 在 gzip / chunked transfer 下可能不返回 Content-Length, 此时 total 为 undefined, UI 退回到不确定进度态 */
    const totalHeader = response.headers.get('Content-Length');
    const total = totalHeader ? Number(totalHeader) || undefined : undefined;
    let loaded = 0;
    let lastReport = 0;
    onProgress(0, total);
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      await writable.write(value);
      loaded += value.byteLength;
      const now = Date.now();
      if (now - lastReport >= PROGRESS_REPORT_INTERVAL_MS) {
        lastReport = now;
        onProgress(loaded, total);
      }
    }
    await writable.close();
    writableClosed = true;

    /* 下载完整后回读临时文件, 解析 codec / bitRate 并拼到最终文件名; 解析失败则不带 tag, 用基础文件名兜底 */
    let finalFilename = baseFilename;
    try {
      const file = await tempFileHandle.getFile();
      const metadata = await getMusicFileMetadata(file);
      const tag = composeFilenameTag(metadata.codec, metadata.bitRate);
      if (tag) {
        finalFilename = formatMusicFilename({
          name: music.name,
          singerNames,
          ext,
          tag,
        });
      }
    } catch (metadataError) {
      logger.error(metadataError, '解析导出文件元数据失败, 使用基础文件名');
    }

    /* 原子改名为最终文件名; move 自带 sanitize/校验, 失败会进入下方 catch 清理临时文件 */
    await (
      tempFileHandle as FileSystemFileHandle & {
        move: (newName: string) => Promise<void>;
      }
    ).move(finalFilename);
    /* 收尾再补推一次, 确保 UI 能落到 100% 而不是停在最后一次节流的位置 */
    onProgress(loaded, total);
  } catch (error) {
    if (!writableClosed) {
      await writable.abort().catch(() => {});
    }
    /* 不管是下载阶段、落盘阶段还是 move 阶段失败, 都把临时文件清掉避免目录里堆 .cicada-part 残留 */
    await directoryHandle.removeEntry(tempFilename).catch(() => {});
    throw error;
  }
}

function exportAndSaveWithTimeout(
  exportingMusic: ExportingMusic,
  onProgress: OnProgress,
) {
  /* 超时或异常时通过 AbortController 中止 fetch, 防止后台继续消耗流量 */
  const controller = new AbortController();
  return Promise.race([
    exportAndSave(exportingMusic, onProgress, controller.signal),
    timeout(1000 * 60 * 5),
  ]).finally(() => controller.abort());
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
                  /* 清掉上一轮失败时残留的进度, 避免下一轮启动前显示旧百分比 */
                  loaded: undefined,
                  total: undefined,
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
                    loaded: undefined,
                    total: undefined,
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
    /* 同时进行中的导出最多 2 个: 缓解 CDN 限速并避免过多并行写流给磁盘添堵 */
    if (exportingList.length >= 2) {
      return;
    }
    const waiting = exportingMusicList.findLast(
      (m) => m.status === ExportStatus.WAITING,
    );
    if (waiting) {
      setExportingMusicList((ml) =>
        ml.map((m) =>
          m.id === waiting.id
            ? {
                ...waiting,
                status: ExportStatus.EXPORTING,
                loaded: undefined,
                total: undefined,
              }
            : m,
        ),
      );
      /* 接收来自 exportAndSave 的进度回调, 把字节数写回对应条目, 让 UI 能渲染环形进度 */
      const onProgress: OnProgress = (loaded, total) =>
        setExportingMusicList((ml) =>
          ml.map((m) =>
            m.id === waiting.id ? { ...m, loaded, total } : m,
          ),
        );
      exportAndSaveWithTimeout(waiting, onProgress)
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
