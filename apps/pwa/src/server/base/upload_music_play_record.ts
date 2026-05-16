import { ExceptionCode } from '@/constants/exception';
import {
  useServer,
  getSelectedServer,
  getSelectedUser,
} from '@/global_states/server';
import ErrorWithCode from '@/utils/error_with_code';
import { getCommonParams } from '..';

const UPLOAD_TIMEOUT = 10 * 1000;

export interface MusicPlayRecordUploadPayload {
  musicId: string;
  percent: number;
  clientRecordId?: string;
}

export interface MusicPlayRecordUploadAuth {
  origin: string;
  token: string;
}

function normalizePercent(percent: number) {
  if (!Number.isFinite(percent)) {
    return 0;
  }
  // HTMLMediaElement 的 played/duration 在结束附近可能略微越界, 上传前先收敛到接口约定范围.
  return Math.min(Math.max(percent, 0), 1);
}

function buildUploadURL(origin: string) {
  const commonParams = getCommonParams();
  return `${origin}/base/music_play_record?${Object.keys(commonParams)
    .map(
      (key) =>
        `${window.encodeURIComponent(key)}=${window.encodeURIComponent(
          commonParams[key],
        )}`,
    )
    .join('&')}`;
}

function buildUploadBody({
  auth,
  payload,
}: {
  auth: MusicPlayRecordUploadAuth;
  payload: MusicPlayRecordUploadPayload;
}) {
  return JSON.stringify({
    token: auth.token,
    musicId: payload.musicId,
    clientRecordId: payload.clientRecordId,
    percent: normalizePercent(payload.percent),
  });
}

export function getCurrentMusicPlayRecordUploadAuth() {
  const selectedServer = getSelectedServer(useServer.getState());
  if (!selectedServer) {
    return null;
  }
  const selectedUser = getSelectedUser(selectedServer);
  if (!selectedUser) {
    return null;
  }
  return {
    origin: selectedServer.origin,
    userId: selectedUser.id,
    token: selectedUser.token,
  };
}

export function sendMusicPlayRecordBeacon(
  payload: MusicPlayRecordUploadPayload,
  auth: MusicPlayRecordUploadAuth | null = getCurrentMusicPlayRecordUploadAuth(),
) {
  if (!auth) {
    throw new ErrorWithCode(
      'Not authorized from local',
      ExceptionCode.NOT_AUTHORIZED,
    );
  }
  const blob = new Blob(
    [buildUploadBody({ auth, payload })],
    {
      type: 'application/json; charset=utf-8',
    },
  );

  return window.navigator.sendBeacon(buildUploadURL(auth.origin), blob);
}

export async function uploadMusicPlayRecord(
  payload: MusicPlayRecordUploadPayload,
  auth: MusicPlayRecordUploadAuth | null = getCurrentMusicPlayRecordUploadAuth(),
) {
  if (!auth) {
    throw new ErrorWithCode(
      'Not authorized from local',
      ExceptionCode.NOT_AUTHORIZED,
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);
  let response: Response;
  try {
    response = await window.fetch(buildUploadURL(auth.origin), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: buildUploadBody({ auth, payload }),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
  if (response.status !== 200) {
    throw new ErrorWithCode(response.statusText, response.status);
  }

  const {
    code,
    message,
  }: {
    code: ExceptionCode;
    message: string;
  } = await response.json();
  if (code !== ExceptionCode.SUCCESS) {
    throw new ErrorWithCode(message, code);
  }
}

export default sendMusicPlayRecordBeacon;
