import styled, { css } from 'styled-components';
import mm from '@/global_states/mini_mode';
import { useContext } from 'react';
import { ZIndex } from '../constants';
import Cover from './cover';
import Operation from './operation';
import Info from './info';
import Progress from './progress';
import Time from './time';
import Context from '../context';

const Style = styled.div`
  z-index: ${ZIndex.CONTROLLER};

  height: calc(env(safe-area-inset-bottom, 0) + 60px);

  display: flex;
  flex-direction: column;

  background-color: rgb(255 255 255 / 0.75);

  > .content {
    flex: 1;
    min-height: 0;

    display: flex;

    > .rest {
      flex: 1;
      min-width: 0;

      display: flex;
      align-items: center;

      padding-bottom: env(safe-area-inset-bottom, 0);
    }
  }

  ${({ theme: { miniMode } }) => css`
    > .content {
      gap: ${miniMode ? 10 : 20}px;

      padding-right: ${miniMode ? 10 : 20}px;

      > .rest {
        gap: ${miniMode ? 10 : 20}px;
      }
    }
  `}
`;

function Controller() {
  const {
    playqueue,
    currentPlayqueuePosition,
    audioPaused,
    audioLoading,
    audioDuration,
  } = useContext(Context);
  const queueMusic = playqueue[currentPlayqueuePosition];

  const miniMode = mm.useState();
  return (
    <Style>
      <Progress duration={audioDuration} />
      <div className="content">
        <Cover cover={queueMusic.cover} />
        <div className="rest">
          <Info queueMusic={queueMusic} />
          {miniMode ? null : <Time duration={audioDuration} />}
          <Operation
            queueMusic={queueMusic}
            paused={audioPaused}
            loading={audioLoading}
          />
        </div>
      </div>
    </Style>
  );
}

export default Controller;
