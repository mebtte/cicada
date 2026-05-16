import { ExceptionCode } from '@/constants/exception';
import {
  sendMusicPlayRecordBeacon,
  uploadMusicPlayRecord,
} from '@/server/base/upload_music_play_record';
import ErrorWithCode from '@/utils/error_with_code';
import logger from '@/utils/logger';
import storage, {
  Key,
  PlayRecordUploadQueueItem,
} from '../storage';

const MAX_QUEUE_LENGTH = 200;

let storageOperationChain: Promise<unknown> = Promise.resolve();
let flushPromise: Promise<void> | null = null;

function runStorageOperation<T>(operation: () => Promise<T>) {
  const result = storageOperationChain.then(operation, operation);
  storageOperationChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function getQueue() {
  return (await storage.getItem(Key.PLAY_RECORD_UPLOAD_QUEUE)) || [];
}

function mergeRecord(
  queue: PlayRecordUploadQueueItem[],
  record: PlayRecordUploadQueueItem,
) {
  const index = queue.findIndex(
    (q) =>
      q.serverOrigin === record.serverOrigin &&
      q.userId === record.userId &&
      q.clientRecordId === record.clientRecordId,
  );
  if (index < 0) {
    return [...queue, record].slice(-MAX_QUEUE_LENGTH);
  }

  const next = [...queue];
  next[index] = {
    ...next[index],
    token: record.token,
    musicId: record.musicId,
    percent: Math.max(next[index].percent, record.percent),
    timestamp: Math.max(next[index].timestamp, record.timestamp),
  };
  return next;
}

export function enqueuePlayRecordUpload(record: PlayRecordUploadQueueItem) {
  return runStorageOperation(async () => {
    await storage.setItem(
      Key.PLAY_RECORD_UPLOAD_QUEUE,
      mergeRecord(await getQueue(), record),
    );
  });
}

function isPermanentUploadError(error: unknown) {
  if (!(error instanceof ErrorWithCode)) {
    return false;
  }
  return [
    ExceptionCode.NOT_AUTHORIZED,
    ExceptionCode.WRONG_PARAMETER,
    ExceptionCode.MUSIC_NOT_EXISTED,
  ].includes(error.code as ExceptionCode);
}

function reportFlushError(error: unknown) {
  logger.error(
    error instanceof Error ? error : new Error(String(error)),
    'Failed to upload music play record',
  );
}

export function sendQueuedPlayRecordBeacon(record: PlayRecordUploadQueueItem) {
  return sendMusicPlayRecordBeacon(
    {
      musicId: record.musicId,
      percent: record.percent,
      clientRecordId: record.clientRecordId,
    },
    {
      origin: record.serverOrigin,
      token: record.token,
    },
  );
}

export function flushPlayRecordUploadQueue() {
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = runStorageOperation(async () => {
    const queue = await getQueue();
    if (!queue.length) {
      return;
    }

    const remaining: PlayRecordUploadQueueItem[] = [];
    for (const record of queue) {
      try {
        await uploadMusicPlayRecord(
          {
            musicId: record.musicId,
            percent: record.percent,
            clientRecordId: record.clientRecordId,
          },
          {
            origin: record.serverOrigin,
            token: record.token,
          },
        );
      } catch (error) {
        if (!isPermanentUploadError(error)) {
          reportFlushError(error);
          remaining.push({
            ...record,
            retryCount: record.retryCount + 1,
          });
        }
      }
    }

    await storage.setItem(
      Key.PLAY_RECORD_UPLOAD_QUEUE,
      remaining.slice(-MAX_QUEUE_LENGTH),
    );
  }).finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}
