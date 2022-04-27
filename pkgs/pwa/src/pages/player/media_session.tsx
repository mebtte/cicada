import React from 'react';
import MediaSession from '@mebtte/react-media-session';

import useAudioControl from './use_audio_control';
import { Music as MusicType } from './constants';

const Wrapper = ({ music }: { music: MusicType }) => {
  const { onPlay, onPause, onPrevious, onNext } = useAudioControl();
  return (
    <MediaSession
      title={music.name}
      artist={music.singers.map((s) => s.name).join(',') || '未知歌手'}
      artwork={[
        {
          src: music.cover,
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ]}
      onPlay={onPlay}
      onPause={onPause}
      onPreviousTrack={onPrevious}
      onNextTrack={onNext}
    />
  );
};

export default React.memo(Wrapper);
