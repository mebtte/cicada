import { useCallback, useEffect, useRef, useState } from 'react';
import getRandomMusic from '@/server/api/get_random_music';
import logger from '@/utils/logger';
import { MusicWithArtistAliases, QueueMusic } from '@/features/player/constants';
import { toRadioQueueMusic } from './utils';

interface FetchOptions {
  excludeId?: string;
}

/**
 * 电台模式的播放队列: 始终保证 currentIndex 之后至少有一首预取歌
 * (供"下一首"立刻播放). currentIndex < 0 表示首次拉取尚未返回.
 */
function useRadioQueue() {
  const [queue, setQueue] = useState<QueueMusic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [fetchingMessage, setFetchingMessage] = useState<string | null>(null);

  const seqRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchOne = useCallback(async ({ excludeId }: FetchOptions = {}) => {
    if (inFlightRef.current) {
      return null;
    }
    inFlightRef.current = true;
    try {
      const music = await getRandomMusic({ excludeId });
      seqRef.current += 1;
      return toRadioQueueMusic(music, seqRef.current);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    setFetchingMessage(null);
    fetchOne()
      .then((qm) => {
        if (canceled || !qm) {
          return;
        }
        setQueue([qm]);
        setCurrentIndex(0);
      })
      .catch((error) => {
        if (canceled) {
          return;
        }
        logger.error(error, '获取电台首曲失败');
        setFetchingMessage((error as Error).message);
      });
    return () => {
      canceled = true;
    };
  }, [fetchOne]);

  // 保持 currentIndex 之后至少有 1 首预取
  useEffect(() => {
    if (currentIndex < 0) {
      return;
    }
    const ahead = queue.length - 1 - currentIndex;
    if (ahead >= 1) {
      return;
    }
    let canceled = false;
    const currentMusic = queue[currentIndex];
    fetchOne({ excludeId: currentMusic?.id })
      .then((qm) => {
        if (canceled || !qm) {
          return;
        }
        setQueue((prev) => [...prev, qm]);
      })
      .catch((error) => logger.error(error, '预取电台下一首失败'));
    return () => {
      canceled = true;
    };
  }, [currentIndex, queue, fetchOne]);

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
  }, []);

  // 通过 ref 让 insertNext 总能拿到最新 currentIndex (避免 useCallback 闭包)
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const insertNext = useCallback((music: MusicWithArtistAliases) => {
    setQueue((prev) => {
      const position = currentIndexRef.current + 1;
      if (position <= 0) {
        return prev;
      }
      seqRef.current += 1;
      const inserted = toRadioQueueMusic(music, seqRef.current);
      const next = [...prev];
      next.splice(position, 0, { ...inserted, shuffle: false });
      return next;
    });
  }, []);

  const remove = useCallback((pid: string) => {
    setQueue((prev) => {
      const index = prev.findIndex((m) => m.pid === pid);
      // 仅允许删除当前播放之后的项, 避免动到已播或正在播的位置.
      if (index <= currentIndexRef.current) {
        return prev;
      }
      return prev.filter((m) => m.pid !== pid);
    });
  }, []);

  return {
    queue,
    currentIndex,
    currentMusic: currentIndex >= 0 ? queue[currentIndex] : undefined,
    nextMusic:
      currentIndex >= 0 && currentIndex + 1 < queue.length
        ? queue[currentIndex + 1]
        : undefined,
    next,
    insertNext,
    remove,
    fetchingMessage,
  };
}

export default useRadioQueue;
