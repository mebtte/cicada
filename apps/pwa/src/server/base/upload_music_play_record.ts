import { ExceptionCode } from '#/constants/exception';
import server, {
  getSelectedServer,
  getSelectedUser,
} from '@/global_states/server';
import ErrorWithCode from '@/utils/error_with_code';

function uploadMusicPlayRecord({
  musicId,
  percent,
}: {
  musicId: string;
  percent: number;
}) {
  const selectedServer = getSelectedServer(server.get());
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
        percent,
      }),
    ],
    {
      type: 'application/json; charset=utf-8',
    },
  );
  return window.navigator.sendBeacon(
    `${selectedServer.origin}/base/music_play_record`,
    blob,
  );
}

export default uploadMusicPlayRecord;
