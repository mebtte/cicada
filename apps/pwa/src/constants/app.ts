import { getAppBaseURL, getAppNamespace } from '../utils/app_url';

// document.baseURI for pages, worker location for the service worker.
export const APP_BASE_URL = getAppBaseURL(
  typeof document === 'undefined' ? globalThis.location.href : document.baseURI,
);

export const APP_NAMESPACE = getAppNamespace(APP_BASE_URL);

export function resolveAppURL(path: string) {
  return new URL(path, APP_BASE_URL).href;
}
