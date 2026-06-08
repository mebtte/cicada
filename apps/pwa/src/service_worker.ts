/* global ServiceWorkerGlobalScope */
import { clientsClaim } from 'workbox-core';
import {
  createHandlerBoundToURL,
  precacheAndRoute,
  PrecacheEntry,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { CacheName } from '@/constants/cache';
import { AssetType } from '@/constants/asset';
import { PathPrefix } from '@/constants/api';
import { CommonQuery } from '@/constants';
import parseSearch from './utils/parse_search';
import definition from './definition';

export type {};
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[];
};

/**
 * 生产模式下缓存构建资源以及收到指令才升级
 * 开发模式下默认自动升级并托管所有 client
 * @author mebtte<i@mebtte.com>
 */
if (process.env.NODE_ENV === 'production') {
  /**
   * workbox injectManifest 注入的缓存资源列表
   * @author mebtte<i@mebtte.com>
   */
  precacheAndRoute(self.__WB_MANIFEST || []);

  /**
   * SPA 路由兜底, 离线刷新任意路由都能进 App Shell
   * 排除后端接口/资源/表单路径, 避免被 index.html 吞掉
   */
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
      denylist: [
        new RegExp(`^/${PathPrefix.API}/`),
        new RegExp(`^/${PathPrefix.ASSET}/`),
        new RegExp(`^/${PathPrefix.BASE}/`),
        new RegExp(`^/${PathPrefix.FORM}/`),
      ],
    }),
  );

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
   * 移除过期的 API cache
   * @author mebtte<i@mebtte.com>
   */
  self.caches.open(CacheName.API).then(async (cache) => {
    const keys = await cache.keys();
    for (const key of keys) {
      const url = new URL(key.url);
      const query = parseSearch<CommonQuery.VERSION>(url.search);
      if (
        !query[CommonQuery.VERSION] ||
        query[CommonQuery.VERSION] !== definition.VERSION
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
 * @author mebtte<i@mebtte.com>
 */
const MEDIA_ASSET_TYPES = [AssetType.MUSIC];
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
 * @author mebtte<i@mebtte.com>
 */
registerRoute(
  ({ request }) => {
    const url = new URL(request.url);
    return (
      url.pathname.startsWith(`/${PathPrefix.ASSET}`) && !isMediaAsset(url)
    );
  },
  new CacheFirst({
    cacheName: CacheName.ASSET,
  }),
);

/**
 * API 网络优先
 * @author mebtte<i@mebtte.com>
 */
const PREVNET_CACHE_PATHS: string[] = [
  '/base/metadata',
  '/base/captcha',
];
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
