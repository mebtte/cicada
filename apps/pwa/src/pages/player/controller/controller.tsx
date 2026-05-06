import styled, { css } from 'styled-components';
import { useContext } from 'react';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import getResizedImage from '@/server/asset/get_resized_image';
import {
  CONTROLLER_FLOATING_BOTTOM,
  CONTROLLER_FLOATING_GAP,
  CONTROLLER_HEIGHT,
  type QueueMusic,
  ZIndex,
} from '../constants';
import Cover from './cover';
import Operation from './operation';
import Info from './info';
import ProgressBar from './progress_bar';
import Time from './time';
import Context from '../context';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { useTheme } from '@/global_states/theme';

const toggleLyric = () =>
  playerEventemitter.emit(PlayerEventType.TOGGLE_LYRIC_PANEL, { open: true });
const Style = styled.div`
  z-index: ${ZIndex.CONTROLLER};

  position: absolute;
  left: ${CONTROLLER_FLOATING_GAP}px;
  right: ${CONTROLLER_FLOATING_GAP}px;
  bottom: ${CONTROLLER_FLOATING_BOTTOM};

  height: ${CONTROLLER_HEIGHT}px;

  display: flex;
  flex-direction: column;

  padding: 6px 10px 8px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 6px 0 rgb(232 232 232);

  > .content {
    flex: 1;
    min-height: 0;

    display: flex;

    > .main {
      flex: 1;
      min-width: 0;
      min-height: 0;

      display: flex;
      flex-direction: column;

      > .rest {
        flex: 1;
        min-height: 0;

        display: flex;
        align-items: center;
      }
    }
  }

  ${({ theme: { miniMode } }) => css`
    > .content {
      gap: ${miniMode ? 10 : 15}px;

      padding-right: ${miniMode ? 0 : 10}px;

      > .main {
        gap: ${miniMode ? 7 : 8}px;

        > .rest {
          gap: ${miniMode ? 10 : 20}px;
        }
      }
    }
  `}

  &:focus-within {
    border-color: var(${CSS_VAR.colorPrimary});
    box-shadow: 0 6px 0 var(${CSS_VAR.colorPrimaryShadow});
  }
`;

function Controller() {
  const {
    playqueue,
    currentPlayqueuePosition,
    audioPaused,
    audioLoading,
    audioDuration,
    audioBufferedPercent,
  } = useContext(Context);
  const queueMusic = playqueue[currentPlayqueuePosition] as
    | QueueMusic
    | undefined;

  const { miniMode } = useTheme();
  return (
    <Style>
      <div className="content">
        <Cover
          cover={
            queueMusic?.cover
              ? getResizedImage({ url: queueMusic.cover, size: 200 })
              : ''
          }
          onClick={queueMusic ? toggleLyric : undefined}
          mask={!!queueMusic}
        />
        <div className="main">
          <ProgressBar
            duration={audioDuration}
            bufferedPercent={audioBufferedPercent}
          />
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
      </div>
    </Style>
  );
}

export default Controller;
