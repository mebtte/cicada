/** The entry page and worker both live directly under the app's mount path. */
export function getAppBaseURL(baseURI: string) {
  return new URL('./', baseURI).href;
}

export function getAppNamespace(baseURL: string) {
  return `cicada-v1:${encodeURIComponent(new URL(baseURL).pathname)}`;
}

export function getAppNavigationPattern(baseURL: string) {
  const pathname = new URL(baseURL).pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${pathname}(?:\\?.*)?$`);
}
