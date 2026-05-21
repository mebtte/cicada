import { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { QueueMusic } from '../../constants';
import {
  LYRIC_PANEL_CONTROLLER_BOTTOM_PADDING,
  LYRIC_PANEL_CONTROLLER_GAP,
} from '../constants';
import Operation from './operation';
import Info from './info';
import ProgressBar from './progress_bar';

const Style = styled.div`
  z-index: 2;

  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;

  padding: 10px 0 ${LYRIC_PANEL_CONTROLLER_BOTTOM_PADDING} 0;

  overflow: hidden;

  display: flex;
  flex-direction: column;
  gap: ${LYRIC_PANEL_CONTROLLER_GAP}px;
`;

function Controller({
  queueMusic,
  paused,
  duration,
  loading,
  bufferedPercent,
  onHeightChange,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  duration: number;
  loading: boolean;
  bufferedPercent: number;
  onHeightChange: (height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateHeight = () => onHeightChange(container.offsetHeight);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [onHeightChange]);

  return (
    <Style ref={containerRef}>
      {/* 工具栏在上 */}
      <Operation queueMusic={queueMusic} paused={paused} loading={loading} />
      <ProgressBar duration={duration} bufferedPercent={bufferedPercent} />
      {/* 歌名/歌手在下 */}
      <Info queueMusic={queueMusic} />
    </Style>
  );
}

export default Controller;
