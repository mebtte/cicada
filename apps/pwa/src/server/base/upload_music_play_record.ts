import { ExceptionCode } from '@/constants/exception';
import {
  useServer,
  getSelectedServer,
  getSelectedUser,
} from '@/global_states/server';
import ErrorWithCode from '@/utils/error_with_code';
import { getCommonParams } from '..';

function normalizePercent(percent: number) {
  if (!Number.isFinite(percent)) {
    return 0;
  }
  // HTMLMediaElement 的 played/duration 在结束附近可能略微越界, 上传前先收敛到接口约定范围.
  return Math.min(Math.max(percent, 0), 1);
}

function uploadMusicPlayRecord({
  musicId,
  percent,
}: {
  musicId: string;
  percent: number;
}) {
  const selectedServer = getSelectedServer(useServer.getState());
  if (!selectedServer) {
    throw new ErrorWithCode(
      'Not authorized from local',
      ExceptionCode.NOT_AUTHORIZED,
    );
  }
  const selectedUser = getSelectedUser(selectedServer);
  if (!selectedUser) {
    throw new ErrorWithCode(
      'Not authorized from local',
      ExceptionCode.NOT_AUTHORIZED,
    );
  }

  const blob = new Blob(
    [
      JSON.stringify({
        token: selectedUser.token,
        musicId,
        percent: normalizePercent(percent),
      }),
    ],
    {
      type: 'application/json; charset=utf-8',
    },
  );

  const commonParams = getCommonParams();
  return window.navigator.sendBeacon(
    `${selectedServer.origin}/base/music_play_record?${Object.keys(commonParams)
      .map((key) => `${key}=${commonParams[key]}`)
      .join('&')}`,
    blob,
  );
}

export default uploadMusicPlayRecord;
