import { useEffect, useMemo, useState } from 'react';
import { MusicPlaybackQuality } from '@/constants/setting';
import {
  cacheAudioAsset,
  isAbortError,
  isAudioAssetCacheEnabled,
} from '@/utils/audio_asset_cache';
import CustomAudio from '@/utils/custom_audio';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import logger from '@/utils/logger';
import { QueueMusic } from '../constants';

const PRELOAD_START_DELAY = 3000;

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function getAudioSrc(audio: CustomAudio<QueueMusic> | null) {
  return audio ? audio.getSrc() : null;
}

function dedupeUrls(urls: string[]) {
  const urlSet = new Set<string>();
  const dedupedUrls: string[] = [];
  for (const url of urls) {
    if (!urlSet.has(url)) {
      urlSet.add(url);
      dedupedUrls.push(url);
    }
  }
  return dedupedUrls;
}

export default (
  audio: CustomAudio<QueueMusic> | null,
  {
    playqueue,
    currentPlayqueuePosition,
    musicPlaybackQuality,
  }: {
    playqueue: QueueMusic[];
    currentPlayqueuePosition: number;
    musicPlaybackQuality: MusicPlaybackQuality;
  },
) => {
  const currentUrl = getAudioSrc(audio);
  const [preloadBlocked, setPreloadBlocked] = useState(true);
  const preloadUrls = useMemo(() => {
    if (!currentUrl || currentPlayqueuePosition < 0) {
      return [];
    }

    return dedupeUrls(
      playqueue
        .slice(currentPlayqueuePosition + 1)
        .map((queueMusic) =>
          getMusicPlaybackAsset({
            asset: queueMusic.asset,
            quality: musicPlaybackQuality,
          }),
        )
        .filter((url) => url !== currentUrl),
    );
  }, [currentUrl, currentPlayqueuePosition, musicPlaybackQuality, playqueue]);

  /**
   * 当前音乐只交给 audio 加载.
   * 后续预加载必须给当前音频让路, 稳定播放后再运行.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    setPreloadBlocked(true);
    if (!audio) {
      return;
    }

    let unblockTimer: number | null = null;
    const clearUnblockTimer = () => {
      if (unblockTimer !== null) {
        window.clearTimeout(unblockTimer);
        unblockTimer = null;
      }
    };
    const blockPreload = () => {
      clearUnblockTimer();
      setPreloadBlocked(true);
    };
    const unblockPreloadLater = () => {
      clearUnblockTimer();
      unblockTimer = window.setTimeout(
        () => setPreloadBlocked(false),
        PRELOAD_START_DELAY,
      );
    };

    const unlistenLoadStart = audio.listen('loadstart', blockPreload);
    const unlistenWaiting = audio.listen('waiting', blockPreload);
    const unlistenStalled = audio.listen('stalled', blockPreload);
    const unlistenSeeking = audio.listen('seeking', blockPreload);
    const unlistenPlaying = audio.listen('playing', unblockPreloadLater);
    const unlistenCanplaythrough = audio.listen(
      'canplaythrough',
      unblockPreloadLater,
    );
    const unlistenSeeked = audio.listen('seeked', unblockPreloadLater);
    if (!audio.isPaused()) {
      unblockPreloadLater();
    }

    return () => {
      clearUnblockTimer();
      unlistenLoadStart();
      unlistenWaiting();
      unlistenStalled();
      unlistenSeeking();
      unlistenPlaying();
      unlistenCanplaythrough();
      unlistenSeeked();
    };
  }, [audio]);

  /**
   * 按播放队列顺序单并发预加载当前音乐之后的所有音乐.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    if (
      !currentUrl ||
      preloadBlocked ||
      !preloadUrls.length ||
      !isAudioAssetCacheEnabled()
    ) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      for (const url of preloadUrls) {
        if (controller.signal.aborted) {
          return;
        }

        try {
          await cacheAudioAsset(url, {
            signal: controller.signal,
          });
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }
          logger.error(
            normalizeError(error),
            `Failed to preload music "${url}"`,
          );
        }
      }
    })();

    return () => controller.abort();
  }, [currentUrl, preloadBlocked, preloadUrls]);
};
