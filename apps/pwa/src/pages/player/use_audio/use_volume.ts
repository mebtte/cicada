import { useEffect } from 'react';
import setting from '@/global_states/setting';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';

export default (audio: CustomAudio<QueueMusic> | null) => {
  const { playerVolume } = setting.useState();

  useEffect(() => {
    if (audio) {
      audio.setVolume(playerVolume);
    }
  }, [audio, playerVolume]);
};
