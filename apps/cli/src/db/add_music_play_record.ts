import { getDB } from '.';

function addMusicPlayRecord({
  userId,
  musicId,
  percent,
}: {
  userId: string;
  musicId: string;
  percent: number;
}) {
  return getDB().run(
    `
      insert into music_play_record(userId, musicId, percent, timestamp)
        values(?, ?, ?, ?)
    `,
    [userId, musicId, percent, Date.now()],
  );
}

export default addMusicPlayRecord;
