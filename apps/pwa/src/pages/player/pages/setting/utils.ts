import { CacheName } from '@/constants/cache';
import logger from '@/utils/logger';

export function clearApiCache() {
  if (window.caches) {
    window.caches
      .delete(CacheName.API)
      .catch((error) => logger.error(error, 'Failed to remove cache'));
  }
}
