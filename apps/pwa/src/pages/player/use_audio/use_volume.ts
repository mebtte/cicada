import { useEffect, useRef } from 'react';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';
import { useSetting } from '@/global_states/setting';

const VOLUME_EPSILON = 0.001;

export default (audio: CustomAudio<QueueMusic> | null) => {
  const { playerVolume } = useSetting();
  const lastWrittenVolumeRef = useRef(playerVolume);

  useEffect(() => {
    if (audio) {
      lastWrittenVolumeRef.current = playerVolume;
      audio.setVolume(playerVolume);
    }
  }, [audio, playerVolume]);

  useEffect(() => {
    if (audio) {
      return audio.listen('volumechange', () => {
        const current = audio.getVolume();
        if (Math.abs(current - lastWrittenVolumeRef.current) < VOLUME_EPSILON) {
          return;
        }
        lastWrittenVolumeRef.current = current;
        useSetting.setState({ playerVolume: current });
      });
    }
  }, [audio]);
};
