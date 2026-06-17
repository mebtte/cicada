import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import absoluteFullSize from '@/style/absolute_full_size';
import Spinner from '@/components/spinner';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { QueueMusic } from '@/features/player/constants';
import Backdrop from '@/features/player/lyric_panel/backdrop';
import Center from './center';
import Info from './info';
import Operation from './operation';

const LYRIC_PANEL_CONTROLLER_GAP = 10;
const TOOLBAR_TITLE_GAP = 16;
const LYRIC_PANEL_PROGRESS_BOTTOM_PADDING = 12;

const Style = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #fff;
  overflow: hidden;
`;
const Bottom = styled.div`
  z-index: 2;

  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;

  padding: 10px 0
    calc(
      ${LYRIC_PANEL_CONTROLLER_GAP}px + ${LYRIC_PANEL_PROGRESS_BOTTOM_PADDING}px +
        env(safe-area-inset-bottom, 0px)
    )
    0;

  display: flex;
  flex-direction: column;
  gap: ${TOOLBAR_TITLE_GAP}px;
`;
const Placeholder = styled.div`
  ${absoluteFullSize}
  ${flexCenter}
  flex-direction: column;
  gap: 16px;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;
function RadioPage({
  queueMusic,
  paused,
  loading,
  fetchingMessage,
  onTogglePlay,
  onNext,
  onOpenQueue,
  onExit,
}: {
  queueMusic: QueueMusic | undefined;
  paused: boolean;
  loading: boolean;
  fetchingMessage: string | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenQueue: () => void;
  onExit: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [bottomHeight, setBottomHeight] = useState(0);

  useLayoutEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const measure = () => setBottomHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [queueMusic]);

  if (!queueMusic) {
    return (
      <Style>
        <Placeholder>
          {fetchingMessage ? (
            <span>{fetchingMessage}</span>
          ) : (
            <>
              <Spinner />
              <span>{t('radio_mode')}</span>
            </>
          )}
        </Placeholder>
      </Style>
    );
  }
  return (
    <Style>
      <Backdrop cover={queueMusic.cover} />
      <Center queueMusic={queueMusic} bottomGap={bottomHeight} />
      <Bottom ref={bottomRef}>
        <Operation
          queueMusic={queueMusic}
          paused={paused}
          loading={loading}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onOpenQueue={onOpenQueue}
          onExit={onExit}
        />
        <Info queueMusic={queueMusic} />
      </Bottom>
    </Style>
  );
}

export default RadioPage;
