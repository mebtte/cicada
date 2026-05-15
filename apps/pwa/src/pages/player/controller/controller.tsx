import styled, { css } from 'styled-components';
import { useContext } from 'react';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import getResizedImage from '@/server/asset/get_resized_image';
import {
  CONTROLLER_BORDER_WIDTH,
  CONTROLLER_BUTTON_ROW_HEIGHT,
  CONTROLLER_COVER_HEIGHT,
  CONTROLLER_FLOATING_BOTTOM,
  CONTROLLER_FLOATING_GAP,
  CONTROLLER_HEIGHT,
  CONTROLLER_PROGRESS_BUTTON_GAP,
  CONTROLLER_VERTICAL_PADDING,
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
const Style = styled.div<{ $playing: boolean }>`
  z-index: ${ZIndex.CONTROLLER};

  position: absolute;
  left: 50%;
  bottom: ${CONTROLLER_FLOATING_BOTTOM};
  transform: translateX(-50%);

  width: calc(100% - ${CONTROLLER_FLOATING_GAP * 4}px);
  height: ${CONTROLLER_HEIGHT}px;

  display: flex;
  flex-direction: column;

  padding: ${CONTROLLER_VERTICAL_PADDING}px 10px;

  background: #fff;
  border: ${CONTROLLER_BORDER_WIDTH}px solid
    ${({ $playing }) =>
      $playing ? `var(${CSS_VAR.colorPrimary})` : CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 6px 0
    ${({ $playing }) =>
      $playing
        ? `var(${CSS_VAR.colorPrimaryShadow})`
        : CSSVariable.COLOR_SURFACE_SHADOW};
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;

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
        flex: 0 0 ${CONTROLLER_BUTTON_ROW_HEIGHT}px;
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

      > .cover {
        align-self: flex-start;
        height: ${CONTROLLER_COVER_HEIGHT}px;
      }

      > .main {
        gap: ${CONTROLLER_PROGRESS_BUTTON_GAP}px;

        > .rest {
          gap: ${miniMode ? 10 : 20}px;
        }
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
    audioBufferedPercent,
  } = useContext(Context);
  const queueMusic = playqueue[currentPlayqueuePosition] as
    | QueueMusic
    | undefined;

  const { miniMode } = useTheme();
  return (
    <Style $playing={!!queueMusic && !audioPaused}>
      <div className="content">
        <Cover
          className="cover"
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
