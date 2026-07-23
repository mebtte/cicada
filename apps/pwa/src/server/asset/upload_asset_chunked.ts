import { ExceptionCode } from '@/constants/exception';
import { AssetType } from '@/constants/asset';
import { HEADER_TOKEN } from '@/constants/api';
import {
  getSelectedServer,
  getSelectedUser,
  useServer,
} from '@/global_states/server';
import definition from '@/definition';
import ErrorWithCode from '@/utils/error_with_code';
import getAssetMaxSize from '@/utils/get_asset_max_size';
import { isSameMajorVersion } from '@/utils/version';
import { bytesToHex, sha256Hex } from '@/utils/sha256';
import { t } from '@/i18n';
import getCommonParams from '@/server/common_params';

export const HASH_CHUNK_SIZE = 4 * 1024 * 1024;
export const DEFAULT_UPLOAD_CHUNK_SIZE = 4 * 1024 * 1024;
const PUT_RETRY_LIMIT = 3;
const PUT_RETRY_BASE_DELAY_MS = 800;

export type UploadPhase =
  | 'hashing'
  | 'initializing'
  | 'uploading'
  | 'completing';

export interface ChunkedUploadResumeMeta {
  uploadId: string;
  fileHash: string;
  chunkSize: number;
}

export interface ChunkedUploadResult {
  /** Final asset id (filename) returned by the server. */
  id: string;
  /** Public path of the asset, mirrors legacy uploadAsset. */
  path: string;
  /** Identity needed to resume a future upload of the same file. */
  meta: ChunkedUploadResumeMeta;
}

export interface ChunkedUploadOptions {
  signal?: AbortSignal;
  /** Reuse a previously stored upload id when resuming after refresh. */
  resumeMeta?: ChunkedUploadResumeMeta;
  onPhase?: (phase: UploadPhase) => void;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
  /** Called once after init so the caller can persist the resume meta. */
  onResumeMetaResolved?: (meta: ChunkedUploadResumeMeta) => void;
  chunkSize?: number;
}

interface ServerResponse<T> {
  code: ExceptionCode;
  message: string;
  data: T;
}

interface InitResponse {
  uploadId: string;
  size: number;
  receivedBytes: number;
  chunkSize: number;
  expiresAt: number;
}

interface PutResponse {
  uploadId: string;
  size: number;
  receivedBytes: number;
  nextOffset: number;
}

interface CompleteResponse {
  id: string;
  path: string;
}

const DEFAULT_TIMEOUT = 60 * 1000;

function getOriginAndHeaders() {
  const selectedServer = getSelectedServer(useServer.getState());
  if (!selectedServer) {
    throw new ErrorWithCode(
      'Not authorized from local',
      ExceptionCode.NOT_AUTHORIZED,
    );
  }
  if (!isSameMajorVersion(definition.VERSION, selectedServer.version)) {
    throw new Error(
      t(
        'server_major_version_mismatch',
        definition.VERSION,
        selectedServer.version,
      ),
    );
  }
  const selectedUser = getSelectedUser(selectedServer);
  if (!selectedUser) {
    throw new ErrorWithCode(
      'Not authorized from local',
      ExceptionCode.NOT_AUTHORIZED,
    );
  }
  return {
    origin: selectedServer.origin,
    token: selectedUser.token,
  };
}

function buildQueryString() {
  const params = getCommonParams();
  return Object.keys(params)
    .map(
      (key) =>
        `${window.encodeURIComponent(key)}=${window.encodeURIComponent(
          params[key],
        )}`,
    )
    .join('&');
}

function withQuery(path: string) {
  return `${path}?${buildQueryString()}`;
}

async function jsonRequest<T>(
  origin: string,
  token: string,
  path: string,
  init: { method: string; body?: BodyInit | null },
  signal?: AbortSignal,
): Promise<T> {
  const response = await window.fetch(`${origin}${withQuery(path)}`, {
    method: init.method,
    headers: {
      'Content-Type': 'application/json',
      [HEADER_TOKEN]: token,
    },
    body: init.body ?? null,
    signal,
  });
  if (response.status !== 200) {
    throw new ErrorWithCode(response.statusText, response.status as never);
  }
  const payload = (await response.json()) as ServerResponse<T>;
  if (payload.code !== ExceptionCode.SUCCESS) {
    throw new ErrorWithCode(payload.message, payload.code);
  }
  return payload.data;
}

/**
 * Reads the file in HASH_CHUNK_SIZE slices so hashing can yield back to the UI.
 * The final SHA-256 must match the server-side verifier exactly.
 */
export async function hashFile(
  file: File | Blob,
  signal?: AbortSignal,
): Promise<string> {
  const total = file.size;
  // The server verifies the SHA-256 of the exact file bytes, so we cannot hash
  // independent chunks and combine those hashes. Sequential reads keep the UI
  // responsive while preserving the final digest input.
  const buffer = new Uint8Array(total);
  let offset = 0;
  while (offset < total) {
    if (signal?.aborted) {
      throw new ErrorWithCode('aborted', 'aborted' as never);
    }
    const end = Math.min(offset + HASH_CHUNK_SIZE, total);
    const slice = file.slice(offset, end);
    const ab = await slice.arrayBuffer();
    buffer.set(new Uint8Array(ab), offset);
    offset = end;
    // Yield to the event loop between chunks so the UI stays responsive.
    await new Promise<void>((r) => window.setTimeout(r, 0));
  }

  const subtle = globalThis.crypto?.subtle;
  if (subtle?.digest) {
    try {
      const digest = await subtle.digest('SHA-256', buffer);
      return bytesToHex(new Uint8Array(digest));
    } catch {
      // Some installed PWA/WebView contexts expose crypto.subtle but fail it
      // at runtime. The JS fallback keeps imports working in those contexts.
    }
  }

  return sha256Hex(buffer);
}

function putChunk(
  origin: string,
  token: string,
  uploadId: string,
  chunk: Blob,
  start: number,
  end: number,
  total: number,
  onUploadProgress: (chunkLoaded: number) => void,
  signal: AbortSignal | undefined,
): Promise<PutResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'PUT',
      `${origin}${withQuery(`/api/common/asset/upload/${uploadId}`)}`,
      true,
    );
    xhr.setRequestHeader(
      'Content-Range',
      `bytes ${start}-${end}/${total}`,
    );
    xhr.setRequestHeader(HEADER_TOKEN, token);
    xhr.timeout = DEFAULT_TIMEOUT;

    const onAbort = () => {
      xhr.abort();
      reject(new ErrorWithCode('aborted', 'aborted' as never));
    };
    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onUploadProgress(event.loaded);
      }
    };
    xhr.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      if (xhr.status !== 200) {
        reject(new ErrorWithCode(xhr.statusText, xhr.status as never));
        return;
      }
      try {
        const payload = JSON.parse(xhr.responseText) as ServerResponse<PutResponse>;
        if (payload.code !== ExceptionCode.SUCCESS) {
          reject(new ErrorWithCode(payload.message, payload.code));
          return;
        }
        resolve(payload.data);
      } catch (error) {
        reject(error as Error);
      }
    };
    xhr.onerror = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new Error(t('can_not_connect_to_server_temporarily')));
    };
    xhr.ontimeout = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new Error(t('timeout_while_fetching_data')));
    };

    xhr.send(chunk);
  });
}

function isRetryablePutError(error: unknown): boolean {
  if (error instanceof ErrorWithCode) {
    if (error.code === ('aborted' as never)) {
      return false;
    }
    if (error.code === ExceptionCode.PARTIAL_UPLOAD_RANGE_INVALID) {
      return false;
    }
    if (error.code === ExceptionCode.PARTIAL_UPLOAD_OWNER_MISMATCH) {
      return false;
    }
    if (error.code === ExceptionCode.NOT_AUTHORIZED) {
      return false;
    }
  }
  return true;
}

async function delay(ms: number, signal?: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(), ms);
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer);
          reject(new ErrorWithCode('aborted', 'aborted' as never));
        },
        { once: true },
      );
    }
  });
}

/**
 * Uploads `file` in chunks to the server. The function is restartable — if a
 * resumeMeta from a previous attempt is supplied, the server is queried for
 * its current receivedBytes and only the missing tail is sent.
 *
 * Throws ErrorWithCode on protocol failures. Aborting via signal raises with
 * code === 'aborted' and leaves the server-side session intact for resume.
 */
async function uploadAssetChunked(
  file: File,
  assetType: AssetType,
  options: ChunkedUploadOptions = {},
): Promise<ChunkedUploadResult> {
  const {
    signal,
    resumeMeta,
    onPhase,
    onProgress,
    onResumeMetaResolved,
    chunkSize = DEFAULT_UPLOAD_CHUNK_SIZE,
  } = options;

  // Music files can be large enough that hashing/uploading before rejection is
  // expensive. Only enforce the client-side cap once server metadata is known.
  const limit =
    assetType === AssetType.MUSIC
      ? getAssetMaxSize(assetType, file.type)
      : undefined;
  if (limit && file.size > limit) {
    throw new ErrorWithCode(
      t('import_asset_oversize'),
      ExceptionCode.ASSET_OVERSIZE,
    );
  }

  onPhase?.('hashing');
  const fileHash = resumeMeta?.fileHash ?? (await hashFile(file, signal));

  const { origin, token } = getOriginAndHeaders();

  onPhase?.('initializing');
  const initRes = await jsonRequest<InitResponse>(
    origin,
    token,
    '/api/common/asset/upload',
    {
      method: 'POST',
      body: JSON.stringify({
        assetType,
        size: file.size,
        fileHash,
        chunkSize: resumeMeta?.chunkSize ?? chunkSize,
        filename: file.name,
      }),
    },
    signal,
  );

  const uploadId = initRes.uploadId;
  const effectiveChunkSize = initRes.chunkSize;
  const meta: ChunkedUploadResumeMeta = {
    uploadId,
    fileHash,
    chunkSize: effectiveChunkSize,
  };
  onResumeMetaResolved?.(meta);

  onPhase?.('uploading');
  let received = initRes.receivedBytes;
  onProgress?.(received, file.size);

  while (received < file.size) {
    if (signal?.aborted) {
      throw new ErrorWithCode('aborted', 'aborted' as never);
    }
    const start = received;
    const end = Math.min(start + effectiveChunkSize, file.size) - 1;
    const chunk = file.slice(start, end + 1);

    let attempt = 0;
    let lastError: unknown;
    while (attempt < PUT_RETRY_LIMIT) {
      try {
        const res = await putChunk(
          origin,
          token,
          uploadId,
          chunk,
          start,
          end,
          file.size,
          (chunkLoaded) => onProgress?.(start + chunkLoaded, file.size),
          signal,
        );
        received = res.receivedBytes;
        break;
      } catch (error) {
        lastError = error;
        if (!isRetryablePutError(error)) {
          throw error;
        }
        attempt += 1;
        if (attempt >= PUT_RETRY_LIMIT) {
          throw error;
        }
        await delay(PUT_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), signal);
      }
    }
    onProgress?.(received, file.size);
    void lastError;
  }

  onPhase?.('completing');
  const completeRes = await jsonRequest<CompleteResponse>(
    origin,
    token,
    `/api/common/asset/upload/${uploadId}/complete`,
    { method: 'POST' },
    signal,
  );
  onProgress?.(file.size, file.size);
  return {
    id: completeRes.id,
    path: completeRes.path,
    meta,
  };
}

export default uploadAssetChunked;
