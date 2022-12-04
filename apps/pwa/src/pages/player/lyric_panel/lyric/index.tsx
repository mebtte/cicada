import absoluteFullSize from '@/style/absolute_full_size';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { QueueMusic } from '../../constants';
import { Status } from './constants';
import useLyricData from './use_lyric_data';
import Lyric from './lyric';

const Style = styled(animated.div)`
  z-index: 1;

  ${absoluteFullSize}
  height: calc(100% - 120px);
`;

function Wrapper({ queueMusic }: { queueMusic: QueueMusic }) {
  const lyricData = useLyricData(queueMusic);

  const transitions = useTransition(lyricData, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return transitions((style, d) => {
    switch (d.status) {
      case Status.SUCCESS: {
        return (
          <Style style={style}>
            <Lyric lrcs={d.lrcs} />
          </Style>
        );
      }

      default: {
        return null;
      }
    }
  });
}

export default Wrapper;
