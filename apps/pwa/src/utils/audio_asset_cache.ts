import { CacheName } from '@/constants/cache';
import definition from '@/definition';

interface CacheAudioAssetOptions {
  signal?: AbortSignal;
}

interface InflightTask {
  promise: Promise<boolean>;
}

const inflightTasks = new Map<string, InflightTask>();

export const audioAssetCacheEvents = new EventTarget();

function emitChange() {
  audioAssetCacheEvents.dispatchEvent(new Event('change'));
}

export function isAudioAssetCacheEnabled() {
  return Boolean(definition.WITH_SW && globalThis.caches);
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

async function getMediaCache() {
  return globalThis.caches.open(CacheName.ASSET_MEDIA);
}

async function hasCompleteCachedResponse(cache: Cache, url: string) {
  const response = await cache.match(url);
  if (!response) {
    return false;
  }
  if (response.status === 200) {
    return true;
  }

  await cache.delete(url);
  return false;
}

export async function isAudioAssetCached(url: string) {
  if (!isAudioAssetCacheEnabled()) {
    return false;
  }
  return hasCompleteCachedResponse(await getMediaCache(), url);
}

export function cacheAudioAsset(
  url: string,
  options: CacheAudioAssetOptions,
) {
  if (!isAudioAssetCacheEnabled()) {
    return Promise.resolve(false);
  }

  const existingTask = inflightTasks.get(url);
  if (existingTask) {
    return existingTask.promise;
  }

  const controller = new AbortController();
  const abortFromOuterSignal = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', abortFromOuterSignal, {
        once: true,
      });
    }
  }

  let task: InflightTask;
  const promise = (async () => {
    const cache = await getMediaCache();
    if (await hasCompleteCachedResponse(cache, url)) {
      return true;
    }

    const response = await globalThis.fetch(url, {
      signal: controller.signal,
    });
    if (response.status !== 200) {
      throw new Error(
        `Expected complete audio response for "${url}", got ${response.status}`,
      );
    }

    await cache.put(url, response.clone());
    emitChange();
    return true;
  })().finally(() => {
    if (options.signal) {
      options.signal.removeEventListener('abort', abortFromOuterSignal);
    }
    if (inflightTasks.get(url) === task) {
      inflightTasks.delete(url);
    }
  });

  task = {
    promise,
  };
  inflightTasks.set(url, task);
  return promise;
}

export async function listCachedMusicUrls(): Promise<string[]> {
  if (!isAudioAssetCacheEnabled()) {
    return [];
  }
  const cache = await getMediaCache();
  const requests = await cache.keys();
  return requests.map((r) => r.url);
}

export async function removeCachedMusic(url: string): Promise<boolean> {
  if (!isAudioAssetCacheEnabled()) {
    return false;
  }
  const cache = await getMediaCache();
  const deleted = await cache.delete(url);
  if (deleted) {
    emitChange();
  }
  return deleted;
}

export async function getCacheUsage(): Promise<{
  usage: number;
  quota: number;
}> {
  if (!globalThis.navigator?.storage?.estimate) {
    return { usage: 0, quota: 0 };
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}

export async function requestPersistence(): Promise<boolean> {
  if (!globalThis.navigator?.storage?.persist) {
    return false;
  }
  if (await navigator.storage.persisted()) {
    return true;
  }
  return navigator.storage.persist();
}
