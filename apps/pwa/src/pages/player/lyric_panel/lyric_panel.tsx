import absoluteFullSize from '@/style/absolute_full_size';
import { useContext, useState } from 'react';
import { animated } from 'react-spring';
import styled from 'styled-components';
import { ZIndex } from '../constants';
import Context from '../context';
import Backdrop from './backdrop';
import Controller from './controller';
import Lyric from './lyric';

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
  const [controllerHeight, setControllerHeight] = useState(0);

  return (
    // @ts-expect-error: style is known
    <Style style={style}>
      <Backdrop cover={queueMusic.cover} />
      <Lyric queueMusic={queueMusic} controllerHeight={controllerHeight} />
      <Controller
        queueMusic={queueMusic}
        paused={audioPaused}
        duration={audioDuration}
        loading={audioLoading}
        bufferedPercent={audioBufferedPercent}
        onHeightChange={setControllerHeight}
      />
    </Style>
  );
}

export default LyricPanel;
