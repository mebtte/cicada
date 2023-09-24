import server, {
  getSelectedServer,
  getSelectedUser,
} from '@/global_states/server';

function uploadMusicPlayRecord({
  musicId,
  percent,
}: {
  musicId: string;
  percent: number;
}) {
  const selectedServer = getSelectedServer(server.get());
  if (!selectedServer) {
    throw new Error('No valid server to fetch');
  }
  const selectedUser = getSelectedUser(selectedServer);
  if (!selectedUser) {
    throw new Error('No valid user to fetch');
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
