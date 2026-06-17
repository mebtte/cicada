import { useEffect, useState } from 'react';
import {
  cacheAudioAsset,
  isAbortError,
  isAudioAssetCacheEnabled,
} from '@/utils/audio_asset_cache';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import { MusicPlaybackQuality } from '@/constants/setting';
import CustomAudio from '@/utils/custom_audio';
import logger from '@/utils/logger';
import { QueueMusic } from '@/features/player/constants';

const PRELOAD_START_DELAY = 3000;

/**
 * 当前歌曲稳定播放 3 秒后, 预取下一首的流畅音质 asset, 让用户切歌时
 * 立刻有数据可放. 切歌或缓冲中断时阻断预取.
 */
function useRadioPreload({
  audio,
  nextMusic,
}: {
  audio: CustomAudio<QueueMusic>;
  nextMusic: QueueMusic | undefined;
}) {
  const [unblocked, setUnblocked] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };
    const arm = () => {
      clearTimer();
      timer = window.setTimeout(
        () => setUnblocked(true),
        PRELOAD_START_DELAY,
      );
    };
    const block = () => {
      clearTimer();
      setUnblocked(false);
    };

    const unlistenPlaying = audio.listen('playing', arm);
    const unlistenCanplaythrough = audio.listen('canplaythrough', arm);
    const unlistenLoadStart = audio.listen('loadstart', block);
    const unlistenWaiting = audio.listen('waiting', block);
    const unlistenStalled = audio.listen('stalled', block);
    const unlistenPause = audio.listen('pause', block);

    return () => {
      clearTimer();
      unlistenPlaying();
      unlistenCanplaythrough();
      unlistenLoadStart();
      unlistenWaiting();
      unlistenStalled();
      unlistenPause();
    };
  }, [audio]);

  useEffect(() => {
    if (!unblocked || !nextMusic || !isAudioAssetCacheEnabled()) {
      return;
    }
    const url = getMusicPlaybackAsset({
      asset: nextMusic.asset,
      quality: MusicPlaybackQuality.SMOOTH,
    });
    const controller = new AbortController();
    cacheAudioAsset(url, { signal: controller.signal }).catch((error) => {
      if (!isAbortError(error)) {
        logger.error(error, `预取电台下一首失败: ${url}`);
      }
    });
    return () => controller.abort();
  }, [unblocked, nextMusic]);
}

export default useRadioPreload;
