import storage, { Key } from '@/storage';
import { CacheName } from '@/constants/cache';
import { offlineMusicEvents } from '@/utils/offline_music';
import { audioAssetCacheEvents } from '@/utils/audio_asset_cache';
import definition from '@/definition';
import logger from '@/utils/logger';
import { ServerState } from '@/constants/server';
import { useServer, getSelectedServer, getSelectedUser } from './server';

/**
 * 切换账号 (含同服务器换用户 / 跨服务器换 / 登出) 时清理所有账号相关缓存:
 *   - OFFLINE_MUSIC (localforage): 离线缓存元数据
 *   - CacheName.API (SW): API 响应 (含 profile / 歌单等私有数据)
 *   - CacheName.ASSET_MEDIA (SW): 音频字节 (可能有服务端用户级权限)
 *
 * 不清理 zustand 中的 token / 用户列表 (那由登入登出本身管理).
 * 不在 app 首次启动时清 (lastIdentity 初值就是当前身份).
 */

function computeIdentity(state: ServerState): string {
  const server = getSelectedServer(state);
  if (!server) {
    return '';
  }
  const user = getSelectedUser(server);
  if (!user) {
    return '';
  }
  return `${server.origin}::${user.id}`;
}

async function clearAccountScopedCaches() {
  try {
    await storage.removeItem(Key.OFFLINE_MUSIC);
    offlineMusicEvents.dispatchEvent(new Event('change'));
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'clear OFFLINE_MUSIC on account switch failed',
    );
  }
  if (definition.WITH_SW && globalThis.caches) {
    try {
      await Promise.all([
        globalThis.caches.delete(CacheName.API),
        globalThis.caches.delete(CacheName.ASSET_MEDIA),
      ]);
      audioAssetCacheEvents.dispatchEvent(new Event('change'));
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'clear CacheStorage on account switch failed',
      );
    }
  }
}

let lastIdentity = computeIdentity(useServer.getState());

useServer.subscribe((state) => {
  const next = computeIdentity(state);
  if (next === lastIdentity) {
    return;
  }
  const previous = lastIdentity;
  lastIdentity = next;
  if (!previous) {
    // 首次登录 (从无身份变成有身份), 不需要清前任的数据
    return;
  }
  void clearAccountScopedCaches();
});
