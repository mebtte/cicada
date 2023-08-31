import { useEffect } from 'react';
import definition from '@/definition';
import { EFFECTIVE_PLAY_PERCENT } from '#/constants';
import { CacheName } from '@/constants/cache';
import logger from '@/utils/logger';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';

/**
 * workbox 不支持缓存媒体
 * 需要手动进行缓存
 * 详情查看 https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video
 * @author mebtte<hi@mebtte.com>
 */
export default (audio: CustomAudio<QueueMusic> | null) => {
  useEffect(() => {
    if (audio) {
      return () => {
        const duration = audio.getDuration();
        if (
          definition.WITH_SW &&
          window.caches &&
          duration &&
          audio.getPlayedSeconds() / duration > EFFECTIVE_PLAY_PERCENT
        ) {
          window.caches.open(CacheName.ASSET_MEDIA).then(async (cache) => {
            const exist = await cache.match(audio.extra.asset);
            if (!exist) {
              cache
                .add(audio.extra.asset)
                .catch((error) =>
                  logger.error(
                    error,
                    `Failed to cache music "${audio.extra.asset}"`,
                  ),
                );
            }
          });
        }
      };
    }
  }, [audio]);
};
