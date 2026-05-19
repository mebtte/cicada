import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { PiMusicNotesSimpleLight } from 'react-icons/pi';
import { CSS_VAR } from '@/components/theme';
import { CSSVariable } from '@/global_style';
import eventemitter, { EventType } from './eventemitter';
import { ZIndex } from './constants';

const MAX_STAGE_COUNT = 4;
const MAX_APPEND_COUNT = 3;
const STAGE_DURATION = 1600;
const ROW_GAP = 34;

interface AnimationItem {
  id: number;
  count: number;
}

const stageLife = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(-50%, calc(-50% + 12px), 0) scale(0.94);
  }

  10% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }

  86% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate3d(-50%, calc(-50% - 8px), 0) scale(0.98);
  }
`;

const existingBreathe = keyframes`
  0%, 30% {
    opacity: 0.68;
    transform: translate3d(0, 0, 0);
  }

  58%, 100% {
    opacity: 0.42;
    transform: translate3d(0, -4px, 0);
  }
`;

const slotOpen = keyframes`
  0%, 18% {
    opacity: 0;
    transform: translate3d(0, 18px, 0) scaleX(0.72);
  }

  38%, 76% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scaleX(1);
  }

  100% {
    opacity: 0;
    transform: translate3d(0, -2px, 0) scaleX(0.9);
  }
`;

const appendRow = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, 42px, 0) scale(0.9);
  }

  48% {
    opacity: 1;
    transform: translate3d(0, -4px, 0) scale(1.04);
  }

  72%, 100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const Layer = styled.div`
  z-index: ${ZIndex.FLOATING};

  position: fixed;
  inset: 0;

  pointer-events: none;
`;

// Backdrop height already grows with appended rows, so keep the top anchored.
const STAGE_BACKDROP_TOP = -18;

const getStageBackdropHeight = (count: number) => 196 + (count - 1) * 34;

const Stage = styled.div<{
  $count: number;
}>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 220px;
  height: 312px;
  isolation: isolate;

  animation: ${stageLife} ${STAGE_DURATION}ms ease-out forwards;

  &::before {
    content: '';

    z-index: -1;

    position: absolute;
    top: ${STAGE_BACKDROP_TOP}px;
    left: -30px;
    width: 280px;
    height: ${({ $count }) => getStageBackdropHeight($count)}px;

    background: rgb(255 255 255 / 0.62);
    border-radius: 50%;
    filter: blur(24px);
  }
`;

const RowBase = styled.div<{
  $top: number;
}>`
  position: absolute;
  top: ${({ $top }) => $top}px;
  left: 38px;
  width: 144px;
  height: 28px;

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 0 10px;

  background: #fff;
  border-radius: 10px;

  > .bar {
    flex: 1;
    height: 7px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.34;
  }
`;

const ExistingRow = styled(RowBase)<{
  $delay: number;
}>`
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 3px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};

  animation: ${existingBreathe} ${STAGE_DURATION}ms ease-out forwards;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const AppendSlot = styled.div<{
  $top: number;
  $delay: number;
}>`
  position: absolute;
  top: ${({ $top }) => $top}px;
  left: 34px;
  width: 152px;
  height: 32px;

  border: 2px dashed var(${CSS_VAR.colorPrimary});
  border-radius: 12px;
  opacity: 0;
  transform-origin: center;

  animation: ${slotOpen} 760ms ease-out forwards;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const AppendRow = styled(RowBase)<{
  $delay: number;
}>`
  color: var(${CSS_VAR.colorPrimary});
  border: 2px solid var(${CSS_VAR.colorPrimary});
  box-shadow: 0 3px 0 var(${CSS_VAR.colorPrimaryShadow});
  opacity: 0;

  animation: ${appendRow} 620ms cubic-bezier(0.18, 0.88, 0.24, 1) forwards;
  animation-delay: ${({ $delay }) => $delay}ms;

  > svg {
    width: 19px;
    height: 19px;
  }
`;

function getAppendTop(index: number) {
  return 116 + index * ROW_GAP;
}

function createItem(id: number, count: number): AnimationItem {
  return {
    id,
    count: Math.max(1, Math.min(MAX_APPEND_COUNT, count)),
  };
}

function PlaylistAddAnimation() {
  const [items, setItems] = useState<AnimationItem[]>([]);

  useEffect(() => {
    let nextId = 0;
    return eventemitter.listen(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      ({ musicList }) => {
        const item = createItem(nextId, musicList.length);
        nextId += 1;
        setItems((list) => [...list, item].slice(-MAX_STAGE_COUNT));
      },
    );
  }, []);

  if (!items.length) {
    return null;
  }
  return (
    <Layer>
      {items.map((item) => (
        <Stage
          key={item.id}
          $count={item.count}
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target) {
              setItems((list) => list.filter(({ id }) => id !== item.id));
            }
          }}
        >
          <ExistingRow $top={16} $delay={0}>
            <PiMusicNotesSimpleLight />
            <span className="bar" />
          </ExistingRow>
          <ExistingRow $top={50} $delay={60}>
            <PiMusicNotesSimpleLight />
            <span className="bar" />
          </ExistingRow>
          <ExistingRow $top={84} $delay={120}>
            <PiMusicNotesSimpleLight />
            <span className="bar" />
          </ExistingRow>
          {Array.from({ length: item.count }, (_, index) => {
            const delay = 210 + index * 130;
            const top = getAppendTop(index);
            return (
              <div key={index}>
                <AppendSlot $top={top - 2} $delay={delay - 120} />
                <AppendRow $top={top} $delay={delay}>
                  <PiMusicNotesSimpleLight />
                  <span className="bar" />
                </AppendRow>
              </div>
            );
          })}
        </Stage>
      ))}
    </Layer>
  );
}

export default PlaylistAddAnimation;
