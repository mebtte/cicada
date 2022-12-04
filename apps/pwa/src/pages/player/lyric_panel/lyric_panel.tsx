import absoluteFullSize from '@/style/absolute_full_size';
import { useContext } from 'react';
import { animated } from 'react-spring';
import styled from 'styled-components';
import { ZIndex } from '../constants';
import Context from '../context';
import Backdrop from './backdrop';
import Controller from './controller';

const Style = styled(animated.div)`
  z-index: ${ZIndex.LYRIC_PANEL};

  ${absoluteFullSize}

  background-color: #fff;
`;

function LyricPanel({ style }: { style: unknown }) {
  const { audioPaused, audioDuration, playqueue, currentPlayqueuePosition } =
    useContext(Context);
  const queueMusic = playqueue[currentPlayqueuePosition];

  return (
    // @ts-expect-error
    <Style style={style}>
      <Backdrop cover={queueMusic.cover} />
      <Controller
        queueMusic={queueMusic}
        paused={audioPaused}
        duration={audioDuration}
      />
    </Style>
  );
}

export default LyricPanel;
