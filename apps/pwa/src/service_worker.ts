/// <reference lib="WebWorker" />
/* global ServiceWorkerGlobalScope, RequestDestination */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, PrecacheEntry } from 'workbox-precaching';
import { registerRoute, Route } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { CacheName } from '@/constants/cache';
import { TEMPORARY_PREFIX } from '#/constants';

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

/**
 * 媒体类型需要额外处理
 * 详情查看 https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video
 * @author mebtte<hi@mebtte.com>
 */
const MEDIA_DETINATIONS: RequestDestination[] = ['audio', 'video'];
registerRoute(
  ({ request }) => MEDIA_DETINATIONS.includes(request.destination),
  new CacheFirst({
    cacheName: CacheName.MEDIA,
    matchOptions: {
      ignoreVary: true,
      ignoreSearch: true,
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
 * 静态资源 缓存优先
 * @author mebtte<hi@mebtte.com>
 */
const CACHE_FIRST_DESTINATIONS: RequestDestination[] = [
  'image',
  'style',
  'script',
  'font',
];
registerRoute(
  new Route(
    ({ request }) => CACHE_FIRST_DESTINATIONS.includes(request.destination),
    new CacheFirst({
      cacheName: CacheName.STATIC,
    }),
  ),
);

/**
 * 剩余 网络优先
 * @author mebtte<hi@mebtte.com>
 */
const PREVNET_CACHE_PATHS: string[] = [
  `/${TEMPORARY_PREFIX}/`,
  '/api/captcha',
  '/api/login_code',
];
registerRoute(
  new Route(
    ({ request }) => {
      const url = new URL(request.url);
      return !PREVNET_CACHE_PATHS.includes(url.pathname);
    },
    new NetworkFirst({
      cacheName: CacheName.COMMON,
    }),
  ),
);