import storage, { Key } from '@/storage';
import logger from './logger';
import { requestPersistence } from './audio_asset_cache';

/**
 * 一次性向浏览器申请 persistent storage. 申请过 (无论批准与否) 后不再重试.
 * 由首个真正"用户表达离线意图"的事件触发 (当前是: 一首歌累计播放比例越过 75%).
 * 持久态可显著降低 PWA 离线缓存被驱逐的概率, 尤其在已安装到桌面/主屏的场景.
 */
export default async function ensureStoragePersistenceRequested() {
  const requested = await storage.getItem(Key.STORAGE_PERSISTENCE_REQUESTED);
  if (requested) {
    return;
  }
  await storage.setItem(Key.STORAGE_PERSISTENCE_REQUESTED, true);
  try {
    await requestPersistence();
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'requestPersistence failed',
    );
  }
}
