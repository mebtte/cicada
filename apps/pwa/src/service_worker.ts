/* global ServiceWorkerGlobalScope */
import { clientsClaim, setCacheNameDetails } from 'workbox-core';
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
import { HEADER_TOKEN } from '@/constants/api';
import { APP_BASE_URL, APP_NAMESPACE, resolveAppURL } from '@/constants/app';
import { getAppNavigationPattern } from '@/utils/app_url';
import { getAssetType, isCommonAPIPath } from '@/utils/service_worker_routes';

export type {};
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[];
};

setCacheNameDetails({ prefix: APP_NAMESPACE });

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
   * SPA 路由兜底. PWA 使用 HashRouter, 只有根路径需要返回 App Shell;
   * 其它导航路径交给后端, 避免新增后端路径被 index.html 吞掉.
   */
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL(resolveAppURL('index.html')), {
      allowlist: [getAppNavigationPattern(APP_BASE_URL)],
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

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Only invalidate this deployment's API responses when its app upgrades.
    self.caches.delete(CacheName.API).then(() => undefined),
  );
});

/**
 * 媒体类型, 缓存优先
 * 需要额外处理 range
 * 详情查看 https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video
 * @author mebtte<i@mebtte.com>
 */
registerRoute(
  ({ url }) => getAssetType(url.pathname) === AssetType.MUSIC,
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
  ({ url }) => {
    const type = getAssetType(url.pathname);
    return type !== undefined && type !== AssetType.MUSIC;
  },
  new CacheFirst({
    cacheName: CacheName.ASSET,
  }),
);

/**
 * API 网络优先
 * @author mebtte<i@mebtte.com>
 */
registerRoute(
  ({ request, url }) =>
    request.headers.has(HEADER_TOKEN) && isCommonAPIPath(url.pathname),
  new NetworkFirst({
    cacheName: CacheName.API,
  }),
);
