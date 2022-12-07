import styled from 'styled-components';
import { QueueMusic } from '../../constants';
import Operation from './operation';
import Info from './info';
import Slider from './slider';

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
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  duration: number;
  loading: boolean;
}) {
  return (
    <Style>
      <Info queueMusic={queueMusic} />
      <Slider duration={duration} />
      <Operation queueMusic={queueMusic} paused={paused} loading={loading} />
    </Style>
  );
}

export default Controller;
