import { useEffect } from 'react';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';
import { useSetting } from '@/global_states/setting';

export default (audio: CustomAudio<QueueMusic> | null) => {
  const { playerVolume } = useSetting();

  useEffect(() => {
    if (audio) {
      audio.setVolume(playerVolume);
    }
  }, [audio, playerVolume]);
};
