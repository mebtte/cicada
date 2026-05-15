import {
  hasActiveTasks,
  ImportTask,
  bumpReloadToken,
  updateTask,
  useMusicImport,
} from '@/global_states/music_import';
import uploadAssetChunked, {
  cancelPartialUpload,
} from '@/server/form/upload_asset_chunked';
import createMusic from '@/server/api/create_music';
import updateMusic from '@/server/api/update_music';
import { AssetType } from '@/constants/asset';
import { AllowUpdateKey } from '@/constants/music';
import { base64ToCover } from '@/utils/music_file';
import uploadAsset from '@/server/form/upload_asset';
import logger from '@/utils/logger';

/**
 * Drives queued ImportTasks one at a time across menu navigations within the
 * admin shell. The driver is started once when AdminPage mounts and stopped
 * when AdminPage unmounts; switching between admin sub-routes does NOT stop
 * it because the host component lives outside <Routes>.
 */

const aborts = new Map<string, AbortController>();
let running = false;
let unsubscribe: (() => void) | null = null;

export function startUploadManager() {
  if (unsubscribe) return;
  unsubscribe = useMusicImport.subscribe(() => {
    void drainQueue();
  });
  // Kick once in case something is already queued at mount time.
  void drainQueue();
}

export function stopUploadManager() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  // Pause anything currently running so receivedBytes is preserved server-side.
  for (const [id, controller] of aborts) {
    controller.abort();
    const task = useMusicImport.getState().tasks.find((t) => t.id === id);
    if (task && task.phase !== 'success' && task.phase !== 'failed') {
      updateTask(id, { phase: 'paused' });
    }
  }
  aborts.clear();
  running = false;
}

export function pauseTask(id: string) {
  const controller = aborts.get(id);
  if (controller) {
    controller.abort();
  }
  updateTask(id, { phase: 'paused' });
}

export function resumeTask(id: string) {
  updateTask(id, { phase: 'queued', errorMessage: undefined });
}

export function retryTask(id: string) {
  updateTask(id, { phase: 'queued', errorMessage: undefined });
}

export async function cancelTask(id: string) {
  const controller = aborts.get(id);
  if (controller) {
    controller.abort();
  }
  const task = useMusicImport.getState().tasks.find((t) => t.id === id);
  updateTask(id, { phase: 'canceled' });
  if (task?.resumeMeta?.uploadId) {
    cancelPartialUpload(task.resumeMeta.uploadId).catch((error) =>
      logger.error(error, `Failed to cancel partial upload ${id}`),
    );
  }
}

async function drainQueue() {
  if (running) return;
  const next = useMusicImport
    .getState()
    .tasks.find((t) => t.phase === 'queued');
  if (!next) return;
  running = true;
  try {
    await runOne(next);
  } finally {
    running = false;
    if (hasActiveTasks(useMusicImport.getState())) {
      // Process the next one without waiting for another store change.
      void drainQueue();
    }
  }
}

async function runOne(task: ImportTask) {
  const controller = new AbortController();
  aborts.set(task.id, controller);
  let speedSampleAt = Date.now();
  let speedSampleBytes = task.uploadedBytes;

  try {
    const result = await uploadAssetChunked(
      task.file,
      AssetType.MUSIC,
      {
        signal: controller.signal,
        resumeMeta: task.resumeMeta,
        chunkSize: task.resumeMeta?.chunkSize,
        onPhase: (phase) => updateTask(task.id, { phase }),
        onResumeMetaResolved: (meta) => updateTask(task.id, { resumeMeta: meta }),
        onProgress: (uploaded, total) => {
          const now = Date.now();
          const elapsed = now - speedSampleAt;
          let speedBps = 0;
          if (elapsed >= 500) {
            speedBps = ((uploaded - speedSampleBytes) * 1000) / elapsed;
            speedSampleAt = now;
            speedSampleBytes = uploaded;
          }
          updateTask(task.id, {
            uploadedBytes: uploaded,
            totalBytes: total,
            ...(speedBps ? { speedBps } : {}),
          });
        },
      },
    );

    updateTask(task.id, { phase: 'creating' });
    const musicId = await createMusic({
      name: task.name,
      singerIds: task.singers.map((s) => s.id),
      type: task.type,
      asset: result.id,
    });
    updateTask(task.id, { musicId });

    // Best-effort metadata enrichment using the parsed ID3 tags.
    const updates: Promise<unknown>[] = [];
    if (task.parsed.pictureDataURI) {
      updates.push(
        base64ToCover(task.parsed.pictureDataURI)
          .then((coverBlob) =>
            uploadAsset(coverBlob, AssetType.MUSIC_COVER).then(({ id }) =>
              updateMusic({
                id: musicId,
                key: AllowUpdateKey.COVER,
                value: id,
                requestMinimalDuration: 0,
              }),
            ),
          )
          .catch((error) =>
            logger.error(error, `Failed to attach cover to ${musicId}`),
          ),
      );
    }
    if (task.parsed.year) {
      updates.push(
        updateMusic({
          id: musicId,
          key: AllowUpdateKey.YEAR,
          value: task.parsed.year,
          requestMinimalDuration: 0,
        }).catch((error) =>
          logger.error(error, `Failed to set year for ${musicId}`),
        ),
      );
    }
    await Promise.all(updates);

    updateTask(task.id, { phase: 'success', uploadedBytes: task.totalBytes });
    bumpReloadToken();
  } catch (error) {
    if ((error as { code?: string }).code === ('aborted' as never)) {
      // pause was requested; phase has already been set by the caller.
      return;
    }
    logger.error(error as Error, `Failed to import ${task.fileName}`);
    updateTask(task.id, {
      phase: 'failed',
      errorMessage: (error as Error).message,
    });
  } finally {
    aborts.delete(task.id);
  }
}
