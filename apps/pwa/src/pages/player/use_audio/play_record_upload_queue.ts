import { ExceptionCode } from '@/constants/exception';
import {
  getSelectedServer,
  getSelectedUser,
  useServer,
} from '@/global_states/server';
import uploadMusicPlayRecord from '@/server/api/upload_music_play_record';
import ErrorWithCode from '@/utils/error_with_code';
import logger from '@/utils/logger';
import storage, {
  Key,
  PlayRecordUploadQueueItem,
} from '../storage';

const MAX_QUEUE_LENGTH = 200;
const BASE_RETRY_DELAY = 3 * 1000;
const MAX_RETRY_DELAY = 60 * 1000;
const MIN_FLUSH_INTERVAL = 60 * 1000;

export interface PlayRecordUploadAuth {
  serverOrigin: string;
  userId: string;
}

type FlushResult =
  | {
      type: 'remove';
      record: PlayRecordUploadQueueItem;
      onlyIfCovered: boolean;
    }
  | {
      type: 'retry';
      record: PlayRecordUploadQueueItem;
      retryCount: number;
      nextRetryAt: number;
    };

let storageOperationChain: Promise<unknown> = Promise.resolve();
let flushPromise: Promise<void> | null = null;
let scheduledFlushTimer: number | null = null;
let lastFlushStartedAt = 0;

function runStorageOperation<T>(operation: () => Promise<T>) {
  const result = storageOperationChain.then(operation, operation);
  storageOperationChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function getCurrentMusicPlayRecordUploadAuth(): PlayRecordUploadAuth | null {
  const selectedServer = getSelectedServer(useServer.getState());
  if (!selectedServer) {
    return null;
  }
  const selectedUser = getSelectedUser(selectedServer);
  if (!selectedUser) {
    return null;
  }
  return {
    serverOrigin: selectedServer.origin,
    userId: selectedUser.id,
  };
}

function getCurrentAuthKey() {
  const auth = getCurrentMusicPlayRecordUploadAuth();
  return auth ? `${auth.serverOrigin}\n${auth.userId}` : '';
}

async function getQueue() {
  return (await storage.getItem(Key.PLAY_RECORD_UPLOAD_QUEUE_V2)) || [];
}

function getRecordKey(record: PlayRecordUploadQueueItem) {
  return `${record.serverOrigin}\n${record.userId}\n${record.clientRecordId}`;
}

function mergeRecord(
  queue: PlayRecordUploadQueueItem[],
  record: PlayRecordUploadQueueItem,
) {
  const index = queue.findIndex((q) => getRecordKey(q) === getRecordKey(record));
  if (index < 0) {
    return [...queue, record].slice(-MAX_QUEUE_LENGTH);
  }

  const next = [...queue];
  next[index] = {
    ...next[index],
    musicId: record.musicId,
    percent: Math.max(next[index].percent, record.percent),
    playedAt: Math.max(next[index].playedAt, record.playedAt),
  };
  return next;
}

export function enqueuePlayRecordUpload(record: PlayRecordUploadQueueItem) {
  return runStorageOperation(async () => {
    await storage.setItem(
      Key.PLAY_RECORD_UPLOAD_QUEUE_V2,
      mergeRecord(await getQueue(), record),
    );
  });
}

function isPermanentUploadError(error: unknown) {
  if (!(error instanceof ErrorWithCode)) {
    return false;
  }
  return [
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

function getNextRetryAt(retryCount: number, now: number) {
  const delay =
    BASE_RETRY_DELAY * 2 ** Math.min(Math.max(retryCount - 1, 0), 5);
  return now + Math.min(delay, MAX_RETRY_DELAY);
}

function isCurrentAuthRecord(
  record: PlayRecordUploadQueueItem,
  auth: PlayRecordUploadAuth,
) {
  return (
    record.serverOrigin === auth.serverOrigin && record.userId === auth.userId
  );
}

function recordUploadCoversCurrent(
  current: PlayRecordUploadQueueItem,
  uploaded: PlayRecordUploadQueueItem,
) {
  return (
    current.musicId === uploaded.musicId &&
    current.percent <= uploaded.percent &&
    current.playedAt <= uploaded.playedAt
  );
}

function getFlushCandidates(now: number) {
  return runStorageOperation(async () => {
    const auth = getCurrentMusicPlayRecordUploadAuth();
    if (!auth) {
      return [];
    }
    return (await getQueue()).filter(
      (record) =>
        isCurrentAuthRecord(record, auth) && record.nextRetryAt <= now,
    );
  });
}

function applyFlushResults(results: FlushResult[]) {
  if (!results.length) {
    return Promise.resolve();
  }
  const resultByKey = new Map(
    results.map((result) => [getRecordKey(result.record), result]),
  );

  return runStorageOperation(async () => {
    const queue = await getQueue();
    const next: PlayRecordUploadQueueItem[] = [];
    for (const record of queue) {
      const result = resultByKey.get(getRecordKey(record));
      if (!result) {
        next.push(record);
        continue;
      }

      if (result.type === 'remove') {
        if (
          result.onlyIfCovered &&
          !recordUploadCoversCurrent(record, result.record)
        ) {
          next.push({
            ...record,
            retryCount: 0,
            nextRetryAt: 0,
          });
        }
        continue;
      }

      // 上传失败后保留同一播放会话的最新快照，并对后续 flush 做退避。
      next.push({
        ...record,
        retryCount: result.retryCount,
        nextRetryAt: result.nextRetryAt,
      });
    }
    await storage.setItem(
      Key.PLAY_RECORD_UPLOAD_QUEUE_V2,
      next.slice(-MAX_QUEUE_LENGTH),
    );
  });
}

function clearScheduledFlush() {
  if (scheduledFlushTimer === null) {
    return;
  }
  window.clearTimeout(scheduledFlushTimer);
  scheduledFlushTimer = null;
}

export function flushPlayRecordUploadQueue() {
  clearScheduledFlush();
  if (flushPromise) {
    return flushPromise;
  }

  lastFlushStartedAt = Date.now();
  flushPromise = (async () => {
    for (;;) {
      const candidates = await getFlushCandidates(Date.now());
      if (!candidates.length) {
        return;
      }

      const results: FlushResult[] = [];
      for (const record of candidates) {
        const auth = getCurrentMusicPlayRecordUploadAuth();
        if (!auth || !isCurrentAuthRecord(record, auth)) {
          continue;
        }
        try {
          await uploadMusicPlayRecord({
            musicId: record.musicId,
            percent: record.percent,
            clientRecordId: record.clientRecordId,
            playedAt: record.playedAt,
          });
          results.push({
            type: 'remove',
            record,
            onlyIfCovered: true,
          });
        } catch (error) {
          if (isPermanentUploadError(error)) {
            results.push({
              type: 'remove',
              record,
              onlyIfCovered: false,
            });
          } else {
            reportFlushError(error);
            const retryCount = record.retryCount + 1;
            results.push({
              type: 'retry',
              record,
              retryCount,
              nextRetryAt: getNextRetryAt(retryCount, Date.now()),
            });
          }
        }
      }

      await applyFlushResults(results);
    }
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

export function schedulePlayRecordUploadQueueFlush() {
  if (scheduledFlushTimer !== null) {
    return;
  }

  const now = Date.now();
  const wait = Math.max(0, lastFlushStartedAt + MIN_FLUSH_INTERVAL - now);
  scheduledFlushTimer = window.setTimeout(() => {
    scheduledFlushTimer = null;
    void flushPlayRecordUploadQueue();
  }, wait);
}

let lastAuthKey = getCurrentAuthKey();
useServer.subscribe(() => {
  const authKey = getCurrentAuthKey();
  if (authKey === lastAuthKey) {
    return;
  }
  lastAuthKey = authKey;
  if (authKey) {
    // 登录或切换账号后，尝试同步该账号之前保存在本地的播放记录.
    void flushPlayRecordUploadQueue();
  }
});

export { getCurrentMusicPlayRecordUploadAuth };
