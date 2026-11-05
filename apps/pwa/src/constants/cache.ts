import { APP_NAMESPACE } from './app';

export const CacheName = {
  API: `${APP_NAMESPACE}:api`,
  ASSET: `${APP_NAMESPACE}:asset`,
  ASSET_MEDIA: `${APP_NAMESPACE}:asset-media`,
} as const;
