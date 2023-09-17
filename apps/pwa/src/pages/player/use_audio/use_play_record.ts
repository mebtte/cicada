import { useEffect } from 'react';
import uploadMusicPlayRecord from '@/server/base/upload_music_play_record';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';

function uploadPlayRecord(audio: CustomAudio<QueueMusic>) {
  const duration = audio.getDuration();
  const playedSeconds = audio.getPlayedSeconds();
  return uploadMusicPlayRecord({
    musicId: audio.extra.id,
    percent: duration ? playedSeconds / duration : 0,
  });
}

export default (audio: CustomAudio<QueueMusic> | null) => {
  useEffect(() => {
    if (audio) {
      const onBeforeUnload = () => uploadPlayRecord(audio);
      window.addEventListener('beforeunload', onBeforeUnload);
      return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }
  }, [audio]);

  useEffect(() => {
    if (audio) {
      return () => void uploadPlayRecord(audio);
    }
  }, [audio]);
};
