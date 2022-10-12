import { useMemo } from 'react';
import styled from 'styled-components';
import List from 'react-list';
import { QueueMusic } from '../../constants';
import Container from '../container';
import Music from './music';

const Style = styled(Container)`
  overflow: auto;
  padding: 0 20px;
`;

function Playqueue({
  playqueue,
  currentPlayqueuePosition,
}: {
  playqueue: QueueMusic[];
  currentPlayqueuePosition: number;
}) {
  const reversedPlayqueue = useMemo(
    () => [...playqueue].reverse(),
    [playqueue],
  );
  const { length } = reversedPlayqueue;
  const activeIndex = currentPlayqueuePosition + 1;
  const itemRenderer = (index, key) => {
    const music = reversedPlayqueue[index];
    return (
      <Music
        key={key}
        activeIndex={activeIndex}
        queueMusic={music}
        playqueueLength={length}
      />
    );
  };
  return (
    <Style>
      <List length={length} type="uniform" itemRenderer={itemRenderer} />
    </Style>
  );
}

export default Playqueue;
