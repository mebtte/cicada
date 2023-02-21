import setting from '@/global_states/setting';
import token from '@/global_states/token';

function uploadMusicPlayRecord({
  musicId,
  percent,
}: {
  musicId: string;
  percent: number;
}) {
  const blob = new Blob(
    [
      JSON.stringify({
        token: token.get(),
        musicId,
        percent,
      }),
    ],
    {
      type: 'application/json; charset=utf-8',
    },
  );
  return window.navigator.sendBeacon(
    `${setting.get().serverOrigin || ''}/api/music_play_record`,
    blob,
  );
}

export default uploadMusicPlayRecord;
