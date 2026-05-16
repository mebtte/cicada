import { useEffect, useRef } from 'react';
import getRandomString from '@/utils/generate_random_string';
import {
  getCurrentMusicPlayRecordUploadAuth,
  MusicPlayRecordUploadAuth,
} from '@/server/base/upload_music_play_record';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';
import { PlayRecordUploadQueueItem } from '../storage';
import {
  enqueuePlayRecordUpload,
  flushPlayRecordUploadQueue,
  sendQueuedPlayRecordBeacon,
} from './play_record_upload_queue';

const PERIODIC_UPLOAD_INTERVAL = 15 * 1000;
const PERCENT_UPLOAD_THRESHOLDS = [0.25, 0.5, 0.75, 0.95];
const MAX_TIMEUPDATE_DELTA_SECONDS = 30;

interface ActivePlayRecord {
  serverOrigin: string;
  userId: string;
  token: string;
  clientRecordId: string;
  musicId: string;
  playedSeconds: number;
  lastCurrentTime: number | null;
  maxPercent: number;
  thresholdIndex: number;
}

function getAudioDuration(audio: CustomAudio<QueueMusic>) {
  const duration = audio.getDuration();
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return duration;
}

// 复用同一个 audio 元素时 audio.played 会跨队列项保留, 因此这里按本次播放会话累计进度.
function syncActiveRecordProgress(
  audio: CustomAudio<QueueMusic>,
  activeRecord: ActivePlayRecord,
) {
  const currentTime = audio.getCurrentTime();
  if (!Number.isFinite(currentTime)) {
    return activeRecord.maxPercent;
  }

  if (activeRecord.lastCurrentTime === null) {
    activeRecord.lastCurrentTime = currentTime;
  } else {
    const delta = currentTime - activeRecord.lastCurrentTime;
    activeRecord.lastCurrentTime = currentTime;
    if (
      !audio.isPaused() &&
      delta > 0 &&
      delta <= MAX_TIMEUPDATE_DELTA_SECONDS
    ) {
      activeRecord.playedSeconds += delta;
    }
  }

  const duration = getAudioDuration(audio);
  if (duration > 0) {
    activeRecord.maxPercent = Math.min(
      Math.max(activeRecord.maxPercent, activeRecord.playedSeconds / duration),
      1,
    );
  }
  return activeRecord.maxPercent;
}

function createClientRecordId(queueMusic: QueueMusic) {
  return `${queueMusic.pid}-${Date.now()}-${getRandomString(8, false)}`;
}

function createActivePlayRecord({
  auth,
  queueMusic,
}: {
  auth: MusicPlayRecordUploadAuth & { userId: string };
  queueMusic: QueueMusic;
}): ActivePlayRecord {
  return {
    serverOrigin: auth.origin,
    userId: auth.userId,
    token: auth.token,
    clientRecordId: createClientRecordId(queueMusic),
    musicId: queueMusic.id,
    playedSeconds: 0,
    lastCurrentTime: 0,
    maxPercent: 0,
    thresholdIndex: 0,
  };
}

function createQueueItem(
  audio: CustomAudio<QueueMusic>,
  activeRecord: ActivePlayRecord,
): PlayRecordUploadQueueItem {
  syncActiveRecordProgress(audio, activeRecord);
  return {
    serverOrigin: activeRecord.serverOrigin,
    userId: activeRecord.userId,
    token: activeRecord.token,
    clientRecordId: activeRecord.clientRecordId,
    musicId: activeRecord.musicId,
    percent: activeRecord.maxPercent,
    timestamp: Date.now(),
    retryCount: 0,
  };
}

/**
 * audio 实例已改为长期单例 (避免 iOS Safari 锁屏失效),
 * 切歌不再让 audio 引用变化, 因此通过 queueMusic 作为依赖触发
 * cleanup 上传上一首的播放记录.
 *
 * 时序保证: usePlayRecord 在 useAudio 内部声明早于 setSource effect,
 * effect cleanup 反向执行, 因此 cleanup 跑时 audio.extra 仍是上一首.
 * @author mebtte<i@mebtte.com>
 */
export default (
  audio: CustomAudio<QueueMusic> | null,
  queueMusic: QueueMusic | undefined,
) => {
  const activeRecordRef = useRef<ActivePlayRecord | null>(null);

  const queueCurrentRecord = (
    options: {
      beacon?: boolean;
    } = {},
  ) => {
    if (!audio) {
      return;
    }
    const activeRecord = activeRecordRef.current;
    if (!activeRecord) {
      return;
    }

    const queueItem = createQueueItem(audio, activeRecord);
    if (options.beacon) {
      sendQueuedPlayRecordBeacon(queueItem);
    }
    void enqueuePlayRecordUpload(queueItem).then(() =>
      options.beacon ? undefined : flushPlayRecordUploadQueue(),
    );
  };

  useEffect(() => {
    if (audio && queueMusic) {
      const auth = getCurrentMusicPlayRecordUploadAuth();
      if (!auth) {
        return;
      }

      const activeRecord = createActivePlayRecord({
        auth,
        queueMusic,
      });
      activeRecordRef.current = activeRecord;
      void flushPlayRecordUploadQueue();
      return () => {
        const queueItem = createQueueItem(audio, activeRecord);
        void enqueuePlayRecordUpload(queueItem).then(() =>
          flushPlayRecordUploadQueue(),
        );
        if (activeRecordRef.current === activeRecord) {
          activeRecordRef.current = null;
        }
      };
    }
  }, [audio, queueMusic]);

  useEffect(() => {
    if (!audio) {
      return;
    }

    const uploadAtInterval = window.setInterval(
      () => queueCurrentRecord(),
      PERIODIC_UPLOAD_INTERVAL,
    );
    const unlistenTimeUpdate = audio.listen('timeupdate', () => {
      const activeRecord = activeRecordRef.current;
      if (!activeRecord) {
        return;
      }
      const percent = syncActiveRecordProgress(audio, activeRecord);
      const nextThreshold =
        PERCENT_UPLOAD_THRESHOLDS[activeRecord.thresholdIndex];
      if (nextThreshold !== undefined && percent >= nextThreshold) {
        while (
          PERCENT_UPLOAD_THRESHOLDS[activeRecord.thresholdIndex] !==
            undefined &&
          percent >= PERCENT_UPLOAD_THRESHOLDS[activeRecord.thresholdIndex]
        ) {
          activeRecord.thresholdIndex += 1;
        }
        queueCurrentRecord();
      }
    });
    const unlistenSeeking = audio.listen('seeking', () => {
      const activeRecord = activeRecordRef.current;
      if (activeRecord) {
        activeRecord.lastCurrentTime = null;
      }
    });
    const flushOnOnline = () => void flushPlayRecordUploadQueue();
    const uploadBeforePageFreeze = () => queueCurrentRecord({ beacon: true });
    const uploadWhenHidden = () => {
      if (window.document.visibilityState === 'hidden') {
        uploadBeforePageFreeze();
      }
    };

    window.addEventListener('online', flushOnOnline);
    window.addEventListener('pagehide', uploadBeforePageFreeze);
    window.document.addEventListener('visibilitychange', uploadWhenHidden);
    void flushPlayRecordUploadQueue();

    return () => {
      window.clearInterval(uploadAtInterval);
      unlistenTimeUpdate();
      unlistenSeeking();
      window.removeEventListener('online', flushOnOnline);
      window.removeEventListener('pagehide', uploadBeforePageFreeze);
      window.document.removeEventListener(
        'visibilitychange',
        uploadWhenHidden,
      );
    };
  }, [audio]);
};
