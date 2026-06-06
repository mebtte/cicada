import { useEffect, useMemo, useState } from 'react';
import { MusicPlaybackQuality } from '@/constants/setting';
import {
  cacheAudioAsset,
  isAbortError,
  isAudioAssetCacheEnabled,
} from '@/utils/audio_asset_cache';
import { upsertOfflineMusicMetadata } from '@/utils/offline_music';
import ensureStoragePersistenceRequested from '@/utils/ensure_storage_persistence';
import getMusic from '@/server/api/get_music';
import CustomAudio from '@/utils/custom_audio';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import logger from '@/utils/logger';
import { QueueMusic } from '../constants';

const PRELOAD_START_DELAY = 3000;
const PLAY_CACHE_PERCENT_THRESHOLD = 0.75;
const MAX_TIMEUPDATE_DELTA_SECONDS = 30;

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
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
  /**
   * 从 playqueue 推导 currentUrl, 而不是从 audio.getSrc() 读.
   * 因为 audio 已改为单例, src 的更新发生在 effect 阶段, 渲染期间
   * 读不到最新值, 会导致 currentUrl 派生的 effect 错过切歌信号.
   * @author mebtte<i@mebtte.com>
   */
  const currentMusic =
    currentPlayqueuePosition >= 0
      ? playqueue[currentPlayqueuePosition]
      : undefined;
  const currentUrl = currentMusic
    ? getMusicPlaybackAsset({
        asset: currentMusic.asset,
        quality: musicPlaybackQuality,
      })
    : null;
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
   * 切歌时立即阻断预加载, 等当前音乐稳定播放后再放行.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    setPreloadBlocked(true);
  }, [currentUrl]);

  /**
   * 当前音乐只交给 audio 加载.
   * 后续预加载必须给当前音频让路, 稳定播放后再运行.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
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

  /**
   * 当前歌累计播放比例 (playedSeconds / duration) 越过 75% 时:
   *   1. 主动 cacheAudioAsset 把当前音质字节灌进 ASSET_MEDIA (不依赖
   *      audio 元素自身的 Range 请求是否会被 CacheFirst 顺手缓存)
   *   2. 被动 upsert 元数据 (保留旧 cachedAt, 不抢用户主动下载的排序位)
   *   3. 顺手 getMusic 一次, 让详情接口落进 SW API cache, 离线开 drawer 能用
   * 同一首歌一次会话只触发一次. 切歌后 effect 重新挂载, 重新计数.
   * 用 playedSeconds 而非 currentTime 直接判, 防止 seek 到末尾绕过门槛.
   */
  useEffect(() => {
    if (!audio || !currentMusic || !isAudioAssetCacheEnabled()) {
      return;
    }
    const sessionMusic = currentMusic;
    let playedSeconds = 0;
    let lastTime: number | null = null;
    let fired = false;
    const onTimeUpdate = () => {
      if (fired) {
        return;
      }
      const t = audio.getCurrentTime();
      if (!Number.isFinite(t)) {
        return;
      }
      if (lastTime !== null) {
        const delta = t - lastTime;
        if (
          !audio.isPaused() &&
          delta > 0 &&
          delta <= MAX_TIMEUPDATE_DELTA_SECONDS
        ) {
          playedSeconds += delta;
        }
      }
      lastTime = t;
      const dur = audio.getDuration();
      if (!Number.isFinite(dur) || dur <= 0) {
        return;
      }
      if (playedSeconds / dur < PLAY_CACHE_PERCENT_THRESHOLD) {
        return;
      }
      const src = audio.getSrc();
      if (!src) {
        return;
      }
      fired = true;
      cacheAudioAsset(src, {}).catch((error) => {
        if (!isAbortError(error)) {
          logger.error(
            normalizeError(error),
            'cache audio after 75% play failed',
          );
        }
      });
      upsertOfflineMusicMetadata({
        id: sessionMusic.id,
        asset: sessionMusic.asset,
        type: sessionMusic.type,
        name: sessionMusic.name,
        aliases: sessionMusic.aliases,
        cover: sessionMusic.cover,
        coverThumbnail: sessionMusic.coverThumbnail,
        singers: sessionMusic.singers.map((s) => ({
          id: s.id,
          name: s.name,
          aliases: s.aliases,
        })),
        lyricists: sessionMusic.lyricists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          aliases: artist.aliases,
        })),
      });
      getMusic({ id: sessionMusic.id }).catch(() => undefined);
      ensureStoragePersistenceRequested().catch(() => undefined);
    };
    const onSeeking = () => {
      lastTime = null;
    };
    const unlistenTimeUpdate = audio.listen('timeupdate', onTimeUpdate);
    const unlistenSeeking = audio.listen('seeking', onSeeking);
    return () => {
      unlistenTimeUpdate();
      unlistenSeeking();
    };
  }, [audio, currentMusic]);
};
