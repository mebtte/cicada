export type ServerURLValidationReason = 'empty' | 'invalid' | 'protocol' | 'path';

export class ServerURLValidationError extends Error {
  constructor(public readonly reason: ServerURLValidationReason) {
    super(`Invalid server address: ${reason}`);
    this.name = 'ServerURLValidationError';
  }
}

/** Canonical service address, including its mount path and without a final slash. */
export function normalizeServerBaseURL(input: string): string {
  const value = input.trim();
  if (!value) {
    throw new ServerURLValidationError('empty');
  }
  if (/[\\\u0000-\u0020\u007f?#]/.test(value)) {
    throw new ServerURLValidationError('invalid');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ServerURLValidationError('invalid');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ServerURLValidationError('protocol');
  }
  const parts = value.match(/^https?:\/\/([^/]+)(\/.*)?$/i);
  if (!parts || parts[1].includes('@') || url.username || url.password) {
    throw new ServerURLValidationError('invalid');
  }

  // Inspect the original path before URL parsing can remove dot segments.
  const pathname = parts[2] || '';
  if (
    pathname.includes('//') ||
    !/^[A-Za-z0-9._~/-]*$/.test(pathname) ||
    pathname.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new ServerURLValidationError('path');
  }
  return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
}

const ABSOLUTE_OR_EMBEDDED_URL = /^(?:https?:\/\/|data:|blob:|\/\/)/i;

/** Resolve a logical server path without discarding the service mount path. */
export function buildServerURL(baseURL: string | undefined, path: string): string {
  if (!path || !baseURL || ABSOLUTE_OR_EMBEDDED_URL.test(path)) {
    return path;
  }
  return `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
