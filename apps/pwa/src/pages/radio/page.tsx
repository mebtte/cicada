import { useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import absoluteFullSize from '@/style/absolute_full_size';
import Spinner from '@/components/spinner';
import Button from '@/components/button';
import { Exit } from '@/components/icon';
import useTitlebarAreaRect from '@/utils/use_titlebar_area_rect';
import useWindowWidth from '@/utils/use_window_width';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { QueueMusic } from '@/pages/player/constants';
import Backdrop from '@/pages/player/lyric_panel/backdrop';
import Center from './center';
import Info from './info';
import Operation from './operation';

const EXIT_BUTTON_EDGE_GAP = 12;

const LYRIC_PANEL_CONTROLLER_GAP = 10;
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
  gap: ${LYRIC_PANEL_CONTROLLER_GAP}px;
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
// 退出按钮固定在页面右上角, 通过 inline style 注入的 top/right 兼容
// 浏览器 safe-area 与 PWA windowControlsOverlay 提供的标题栏占位.
const ExitButtonContainer = styled.div`
  position: absolute;
  z-index: 3;
`;

function RadioPage({
  queueMusic,
  paused,
  loading,
  fetchingMessage,
  onTogglePlay,
  onNext,
  onPlayNext,
  onOpenQueue,
  onExit,
}: {
  queueMusic: QueueMusic | undefined;
  paused: boolean;
  loading: boolean;
  fetchingMessage: string | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onPlayNext: () => void;
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

  // 计算退出按钮的右上偏移: 标题栏覆盖区 (PWA windowControlsOverlay) 之外,
  // 浏览器场景退化为 safe-area-inset, 始终留出 EXIT_BUTTON_EDGE_GAP 的边距.
  const windowWidth = useWindowWidth();
  const { height: titlebarHeight, right: titlebarRight } = useTitlebarAreaRect();
  const exitTop = `calc(${titlebarHeight || 0}px + env(safe-area-inset-top, 0px) + ${EXIT_BUTTON_EDGE_GAP}px)`;
  const exitRight = `calc(${
    titlebarRight ? Math.max(windowWidth - titlebarRight, 0) : 0
  }px + env(safe-area-inset-right, 0px) + ${EXIT_BUTTON_EDGE_GAP}px)`;

  const exitButton = (
    <ExitButtonContainer style={{ top: exitTop, right: exitRight }}>
      <Button
        square
        variant="ghost"
        size="sm"
        aria-label={t('exit_radio_mode')}
        onClick={onExit}
      >
        <Exit />
      </Button>
    </ExitButtonContainer>
  );

  if (!queueMusic) {
    return (
      <Style>
        {exitButton}
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
      {exitButton}
      <Center queueMusic={queueMusic} bottomGap={bottomHeight} />
      <Bottom ref={bottomRef}>
        <Operation
          queueMusic={queueMusic}
          paused={paused}
          loading={loading}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onPlayNext={onPlayNext}
          onOpenQueue={onOpenQueue}
        />
        <Info queueMusic={queueMusic} />
      </Bottom>
    </Style>
  );
}

export default RadioPage;
