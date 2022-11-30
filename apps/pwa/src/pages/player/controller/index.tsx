import styled, { css } from 'styled-components';
import mm from '@/global_states/mini_mode';
import { CONTROLLER_HEIGHT, QueueMusic, ZIndex } from '../constants';
import Cover from './cover';
import Operation from './operation';
import Info from './info';
import Progress from './progress';
import Time from './time';

const Style = styled.div`
  z-index: ${ZIndex.CONTROLLER};

  height: calc(env(safe-area-inset-bottom, 0) + ${CONTROLLER_HEIGHT}px);
  padding-bottom: env(safe-area-inset-bottom, 0);

  display: flex;
  flex-direction: column;

  background-color: rgb(255 255 255 / 0.75);

  > .content {
    flex: 1;
    min-height: 0;

    display: flex;
    align-items: center;
  }

  ${({ theme: { miniMode } }) => css`
    > .content {
      gap: ${miniMode ? 10 : 20}px;
      padding-right: ${miniMode ? 10 : 20}px;
    }
  `}
`;

function Controller({
  queueMusic,
  paused,
  loading,
  duration,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  loading: boolean;
  duration: number;
}) {
  const miniMode = mm.useState();
  return (
    <Style>
      <Progress duration={duration} />
      <div className="content">
        <Cover cover={queueMusic.cover} />
        <Info queueMusic={queueMusic} />
        {miniMode ? null : <Time duration={duration} />}
        <Operation queueMusic={queueMusic} paused={paused} loading={loading} />
      </div>
    </Style>
  );
}

export default Controller;
