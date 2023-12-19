import absoluteFullSize from '@/style/absolute_full_size';
import { useContext } from 'react';
import { animated } from 'react-spring';
import styled from 'styled-components';
import { ZIndex } from '../constants';
import Context from '../context';
import Backdrop from './backdrop';
import Controller from './controller';
import Lyric from './lyric';
import WakeLock from './wake_lock';

const Style = styled(animated.div)`
  z-index: ${ZIndex.LYRIC_PANEL};

  ${absoluteFullSize}

  background-color: #fff;
  overflow: hidden;
`;

function LyricPanel({ style }: { style: unknown }) {
  const {
    audioPaused,
    audioDuration,
    audioLoading,
    audioBufferedPercent,
    playqueue,
    currentPlayqueuePosition,
  } = useContext(Context);
  const queueMusic = playqueue[currentPlayqueuePosition];

  return (
    // @ts-expect-error
    <Style style={style}>
      <WakeLock />
      <Backdrop cover={queueMusic.cover} />
      <Lyric queueMusic={queueMusic} />
      <Controller
        queueMusic={queueMusic}
        paused={audioPaused}
        duration={audioDuration}
        loading={audioLoading}
        bufferedPercent={audioBufferedPercent}
      />
    </Style>
  );
}

export default LyricPanel;
