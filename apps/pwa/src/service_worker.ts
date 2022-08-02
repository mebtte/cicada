/// <reference lib="WebWorker" />
/* global ServiceWorkerGlobalScope */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, PrecacheEntry } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { CacheName, Query as CacheQuery } from '@/constants/cache';
import { AssetType, PathPrefix } from '#/constants';
import parseSearch from './utils/parse_search';
import env from './env';

export type {};
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[];
};

/**
 * 生产模式下缓存构建资源以及收到指令才升级
 * 开发模式下默认自动升级并托管所有 client
 * @author mebtte<hi@mebtte.com>
 */
if (process.env.NODE_ENV === 'production') {
  /**
   * workbox injectManifest 注入的缓存资源列表
   * @author mebtte<hi@mebtte.com>
   */
  // eslint-disable-next-line no-underscore-dangle
  precacheAndRoute(self.__WB_MANIFEST || []);

  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
} else {
  self.skipWaiting();
  clientsClaim();
}

self.addEventListener('activate', () => {
  /**
   * 移除已废弃的 cache
   * @author mebtte<hi@mebtte.com>
   */
  self.caches.keys().then((cacheKeys) => {
    const usingCacheKeys = Object.values(CacheName) as string[];
    for (const key of cacheKeys) {
      if (!usingCacheKeys.includes(key)) {
        self.caches.delete(key);
      }
    }
  });

  /**
   * 移除过期的 API cache
   * @author mebtte<hi@mebtte.com>
   */
  self.caches.open(CacheName.API).then(async (cache) => {
    const keys = await cache.keys();
    for (const key of keys) {
      const url = new URL(key.url);
      const query = parseSearch<CacheQuery.VERSION>(url.search);
      if (
        !query[CacheQuery.VERSION] ||
        query[CacheQuery.VERSION] !== env.VERSION
      ) {
        cache.delete(key);
      }
    }
  });
});

/**
 * 媒体类型, 缓存优先
 * 需要额外处理 range
 * 详情查看 https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video
 * @author mebtte<hi@mebtte.com>
 */
const MEDIA_ASSET_TYPES = [
  AssetType.MUSIC_SQ,
  AssetType.MUSIC_AC,
  AssetType.MUSIC_HQ,
];
function isMediaAsset(url: URL) {
  for (const mediaAssetType of MEDIA_ASSET_TYPES) {
    if (url.pathname.includes(`/${mediaAssetType}/`)) {
      return true;
    }
  }
  return false;
}
registerRoute(
  ({ request }) => {
    const url = new URL(request.url);
    return url.pathname.startsWith(`/${PathPrefix.ASSET}`) && isMediaAsset(url);
  },
  new CacheFirst({
    cacheName: CacheName.ASSET_MEDIA,
    matchOptions: {
      ignoreVary: true,
      ignoreSearch: true,
      ignoreMethod: true,
    },
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new RangeRequestsPlugin(),
    ],
  }),
);

/**
 * Asset, 缓存优先
 * 媒体类型已额外处理, 需要排除
 * @author mebtte<hi@mebtte.com>
 */
registerRoute(
  ({ request }) => {
    const url = new URL(request.url);
    return url.pathname.startsWith(`/${PathPrefix.ASSET}`);
  },
  new CacheFirst({
    cacheName: CacheName.ASSET,
  }),
);

/**
 * API 网络优先
 * @author mebtte<hi@mebtte.com>
 */
const PREVNET_CACHE_PATHS: string[] = ['/api/captcha', '/api/login_code'];
registerRoute(
  ({ request }) => {
    const url = new URL(request.url);
    return (
      url.pathname.startsWith(`/${PathPrefix.API}`) &&
      !PREVNET_CACHE_PATHS.includes(url.pathname)
    );
  },
  new NetworkFirst({
    cacheName: CacheName.API,
  }),
);
