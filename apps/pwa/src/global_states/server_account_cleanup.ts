import storage, { Key } from '@/storage';
import { CacheName } from '@/constants/cache';
import { offlineMusicEvents } from '@/utils/offline_music';
import definition from '@/definition';
import logger from '@/utils/logger';
import { ServerState } from '@/constants/server';
import { useServer, getSelectedServer, getSelectedUser } from './server';

/**
 * 切换账号 (含同服务器换用户 / 跨服务器换 / 登出) 时清理账号相关缓存:
 *   - OFFLINE_MUSIC (localforage): 离线缓存元数据
 *   - CacheName.API (SW): API 响应 (含 profile / 歌单等私有数据)
 *
 * 不清理 CacheName.ASSET_MEDIA: 音频资源公开且所有用户访问到的字节相同,
 * 可跨账号复用.
 * 不清理 zustand 中的 token / 用户列表 (那由登入登出本身管理).
 * App 首次启动时不清 (lastIdentity 初值就是当前身份); 之后任何身份变化都清.
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
      await globalThis.caches.delete(CacheName.API);
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
  lastIdentity = next;
  void clearAccountScopedCaches();
});
