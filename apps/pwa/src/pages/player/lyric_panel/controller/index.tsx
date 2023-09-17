import styled from 'styled-components';
import { QueueMusic } from '../../constants';
import Operation from './operation';
import Info from './info';
import ProgressBar from './progress_bar';

const Style = styled.div`
  z-index: 2;

  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;

  padding: 10px 0 max(env(safe-area-inset-bottom, 0), 10px) 0;

  background-color: rgb(255 255 255 / 0.5);
  backdrop-filter: blur(10px);
  overflow: hidden;

  display: flex;
  flex-direction: column;
  gap: 10px;
`;

function Controller({
  queueMusic,
  paused,
  duration,
  loading,
  bufferedPercent,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  duration: number;
  loading: boolean;
  bufferedPercent: number;
}) {
  return (
    <Style>
      <Info queueMusic={queueMusic} />
      <ProgressBar duration={duration} bufferedPercent={bufferedPercent} />
      <Operation queueMusic={queueMusic} paused={paused} loading={loading} />
    </Style>
  );
}

export default Controller;
