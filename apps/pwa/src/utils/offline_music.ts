import storage, { Key, OfflineMusic, OfflineMusicMap } from '@/storage';
import logger from './logger';

export const offlineMusicEvents = new EventTarget();

function emitChange() {
  offlineMusicEvents.dispatchEvent(new Event('change'));
}

async function readAll(): Promise<OfflineMusicMap> {
  return (await storage.getItem(Key.OFFLINE_MUSIC)) || {};
}

export async function getOfflineMusicMap(): Promise<OfflineMusicMap> {
  return readAll();
}

export async function getOfflineMusic(
  musicId: string,
): Promise<OfflineMusic | undefined> {
  const map = await readAll();
  return map[musicId];
}

type OfflineMusicMetadata = Omit<OfflineMusic, 'cachedAt'>;

/**
 * 元数据 upsert: 新建条目设 cachedAt = now; 已存在则保留旧 cachedAt.
 * 当前所有写入路径都是被动 (get_music auto-upsert + 75% 自动入库),
 * 没有"主动下载"通道, 所以不再区分主动/被动 upsert.
 */
export async function upsertOfflineMusicMetadata(
  metadata: OfflineMusicMetadata,
) {
  try {
    const map = await readAll();
    const existing = map[metadata.id];
    map[metadata.id] = {
      ...metadata,
      cachedAt: existing?.cachedAt ?? Date.now(),
    };
    await storage.setItem(Key.OFFLINE_MUSIC, map);
    emitChange();
  } catch (error) {
    logger.error(error, 'upsertOfflineMusicMetadata failed');
  }
}

export async function removeOfflineMusic(musicId: string) {
  const map = await readAll();
  if (!map[musicId]) {
    return undefined;
  }
  const removed = map[musicId];
  delete map[musicId];
  await storage.setItem(Key.OFFLINE_MUSIC, map);
  emitChange();
  return removed;
}
