import { useEffect, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { QueueInsert } from '@/components/icon';
import { PiMusicNotesSimpleLight } from 'react-icons/pi';
import { CSS_VAR } from '@/components/theme';
import { CSSVariable } from '@/global_style';
import eventemitter, { EventType } from './eventemitter';
import { ZIndex } from './constants';

const MAX_ITEM_COUNT = 4;
const INSERT_ANIMATION_DURATION = 1280;

interface AnimationItem {
  id: number;
  direction: number;
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

  84% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate3d(-50%, calc(-50% - 8px), 0) scale(0.98);
  }
`;

const shiftUp = keyframes`
  0%, 32% {
    transform: translate3d(0, 0, 0);
  }

  68%, 100% {
    transform: translate3d(0, -38px, 0);
  }
`;

const tailUp = keyframes`
  0%, 32% {
    opacity: 0.7;
    transform: translate3d(0, 0, 0);
  }

  68%, 100% {
    opacity: 0.35;
    transform: translate3d(0, -30px, 0);
  }
`;

const slotPulse = keyframes`
  0%, 24% {
    opacity: 0;
    transform: scaleX(0.45);
  }

  42%, 78% {
    opacity: 1;
    transform: scaleX(1);
  }

  100% {
    opacity: 0;
    transform: scaleX(0.85);
  }
`;

const insertLeft = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(-34px, -10px, 0) scale(0.56);
  }

  16% {
    opacity: 1;
    transform: translate3d(8px, 8px, 0) scale(1.08);
  }

  48% {
    opacity: 1;
    transform: translate3d(58px, 56px, 0) scale(0.94);
  }

  68%, 100% {
    opacity: 1;
    transform: translate3d(58px, 56px, 0) scale(1);
  }
`;

const insertRight = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(160px, -10px, 0) scale(0.56);
  }

  16% {
    opacity: 1;
    transform: translate3d(118px, 8px, 0) scale(1.08);
  }

  48% {
    opacity: 1;
    transform: translate3d(58px, 56px, 0) scale(0.94);
  }

  68%, 100% {
    opacity: 1;
    transform: translate3d(58px, 56px, 0) scale(1);
  }
`;

const Layer = styled.div`
  z-index: ${ZIndex.FLOATING};

  position: fixed;
  inset: 0;

  pointer-events: none;
`;

const Stage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 218px;
  height: 160px;
  isolation: isolate;
  opacity: 0;
  transform: translate3d(-50%, calc(-50% + 12px), 0) scale(0.94);
  will-change: transform, opacity;

  animation: ${stageLife} ${INSERT_ANIMATION_DURATION}ms ease-out both;

  &::before {
    content: '';

    z-index: -1;

    position: absolute;
    inset: -34px -30px;

    background: rgb(255 255 255 / 0.62);
    border-radius: 50%;
    filter: blur(24px);
  }
`;

const QueueRow = styled.div<{
  $active?: boolean;
  $shift?: boolean;
  $tail?: boolean;
  $top: number;
}>`
  position: absolute;
  top: ${({ $top }) => $top}px;
  left: 44px;
  width: 134px;
  height: 28px;

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 0 10px;

  color: ${({ $active }) =>
    $active ? `var(${CSS_VAR.colorPrimary})` : CSSVariable.TEXT_COLOR_SECONDARY};
  background: #fff;
  border: 2px solid
    ${({ $active }) =>
      $active ? `var(${CSS_VAR.colorPrimary})` : CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  box-shadow: 0 3px 0
    ${({ $active }) =>
      $active
        ? `var(${CSS_VAR.colorPrimaryShadow})`
        : CSSVariable.COLOR_SURFACE_SHADOW};

  ${({ $shift, $tail }) =>
    $shift
      ? css`
          animation: ${$tail ? tailUp : shiftUp}
            ${INSERT_ANIMATION_DURATION}ms ease-out forwards;
        `
      : null}

  > .bar {
    flex: 1;
    height: 7px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.34;
  }
`;

const Slot = styled.div`
  position: absolute;
  top: 61px;
  left: 40px;
  width: 142px;
  height: 32px;

  border: 2px dashed var(${CSS_VAR.colorPrimary});
  border-radius: 12px;
  opacity: 0;

  animation: ${slotPulse} ${INSERT_ANIMATION_DURATION}ms ease-out forwards;
`;

const Incoming = styled.div<{ $direction: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: var(${CSS_VAR.colorPrimary});
  background: #fff;
  border: 2px solid var(${CSS_VAR.colorPrimary});
  border-radius: 50%;
  box-shadow: 0 4px 0 var(${CSS_VAR.colorPrimaryShadow});
  filter: drop-shadow(0 8px 12px rgb(0 0 0 / 0.08));
  opacity: 0;
  transform: ${({ $direction }) =>
    $direction < 0
      ? 'translate3d(-34px, -10px, 0) scale(0.56)'
      : 'translate3d(160px, -10px, 0) scale(0.56)'};
  transform-origin: center;
  backface-visibility: hidden;
  will-change: transform, opacity;

  animation: ${({ $direction }) => ($direction < 0 ? insertLeft : insertRight)}
    ${INSERT_ANIMATION_DURATION}ms cubic-bezier(0.18, 0.88, 0.24, 1) both;

  > svg {
    width: 27px;
    height: 27px;
  }
`;

function createItem(id: number): AnimationItem {
  return {
    id,
    direction: Math.random() > 0.5 ? 1 : -1,
  };
}

function PlayqueueInsertAnimation() {
  const [items, setItems] = useState<AnimationItem[]>([]);

  useEffect(() => {
    let nextId = 0;
    return eventemitter.listen(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      () => {
        const item = createItem(nextId);
        nextId += 1;
        setItems((list) => [...list, item].slice(-MAX_ITEM_COUNT));
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
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target) {
              setItems((list) => list.filter(({ id }) => id !== item.id));
            }
          }}
        >
          <QueueRow $top={102} $active>
            <PiMusicNotesSimpleLight />
            <span className="bar" />
          </QueueRow>
          <Slot />
          <QueueRow $top={64} $shift>
            <PiMusicNotesSimpleLight />
            <span className="bar" />
          </QueueRow>
          <QueueRow $top={24} $shift $tail>
            <PiMusicNotesSimpleLight />
            <span className="bar" />
          </QueueRow>
          <Incoming $direction={item.direction}>
            <QueueInsert />
          </Incoming>
        </Stage>
      ))}
    </Layer>
  );
}

export default PlayqueueInsertAnimation;
