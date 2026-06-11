import {
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
import { ExceptionCode } from '@/constants/exception';
import { AllowUpdateKey } from '@/constants/music';
import { base64ToCover } from '@/utils/music_file';
import uploadAsset from '@/server/form/upload_asset';
import logger from '@/utils/logger';
import { t } from '@/i18n';

/**
 * Drives queued ImportTasks across menu navigations within the
 * admin shell. The driver is started once when AdminPage mounts and stopped
 * when AdminPage unmounts; switching between admin sub-routes does NOT stop
 * it because the host component lives outside <Routes>.
 */

const MAX_PARALLEL_UPLOADS = 3;
const aborts = new Map<string, AbortController>();
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

function drainQueue() {
  const availableSlots = MAX_PARALLEL_UPLOADS - aborts.size;
  if (availableSlots <= 0) return;

  const nextTasks = useMusicImport
    .getState()
    .tasks
    .filter((task) => task.phase === 'queued' && !aborts.has(task.id))
    .slice(0, availableSlots);

  nextTasks.forEach((task) => {
    void runOne(task).finally(() => {
      // Fill newly freed slots immediately instead of waiting for another
      // store update.
      drainQueue();
    });
  });
}

function getSafeImportErrorMessage(error: unknown) {
  const code = (error as { code?: unknown }).code;
  if (code === ExceptionCode.ASSET_OVERSIZE) {
    return t('import_asset_oversize');
  }
  if (code === ExceptionCode.WRONG_ASSET_TYPE) {
    return t('import_wrong_asset_type');
  }

  const err = error as { message?: string; name?: string };
  const message = err.message || '';
  if (
    err.name === 'NotReadableError' ||
    /could not be read|permission|read.*file|file.*read/i.test(message)
  ) {
    return t('import_file_read_failed');
  }

  if (
    message === t('can_not_connect_to_server_temporarily') ||
    message === t('timeout_while_fetching_data')
  ) {
    return message;
  }

  return t('import_failed');
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
      performerIds: task.performers.map((s) => s.id),
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
      errorMessage: getSafeImportErrorMessage(error),
    });
  } finally {
    aborts.delete(task.id);
  }
}
