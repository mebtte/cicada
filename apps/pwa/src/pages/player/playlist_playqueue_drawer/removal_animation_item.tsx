import { ReactNode, TransitionEvent, useEffect } from 'react';
import styled from 'styled-components';
import { REMOVAL_ANIMATION_DURATION_MS } from './use_removal_animation';

const Root = styled.div<{ $leaving: boolean }>`
  max-height: 112px;
  overflow: hidden;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition:
    max-height ${REMOVAL_ANIMATION_DURATION_MS}ms ease,
    opacity 220ms ease,
    transform ${REMOVAL_ANIMATION_DURATION_MS}ms ease;
  will-change: max-height, opacity, transform;

  ${({ $leaving }) =>
    $leaving
      ? `
        max-height: 0;
        opacity: 0;
        pointer-events: none;
        transform: translate3d(100%, 0, 0);
      `
      : ''}
`;

function RemovalAnimationItem({
  children,
  finishRemoval,
  itemKey,
  leaving,
  requestMeasure,
}: {
  children: ReactNode;
  finishRemoval: (key: string) => void;
  itemKey: string;
  leaving: boolean;
  requestMeasure?: () => void;
}) {
  useEffect(() => {
    if (!leaving || !requestMeasure) {
      return undefined;
    }

    let frame: number | null = null;
    let active = true;
    const startedAt = performance.now();
    const tick = () => {
      if (!active) {
        return;
      }

      requestMeasure();
      if (performance.now() - startedAt < REMOVAL_ANIMATION_DURATION_MS) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      active = false;
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [leaving, requestMeasure]);

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      leaving &&
      event.currentTarget === event.target &&
      event.propertyName === 'max-height'
    ) {
      finishRemoval(itemKey);
    }
  };

  return (
    <Root $leaving={leaving} onTransitionEnd={onTransitionEnd}>
      {children}
    </Root>
  );
}

export default RemovalAnimationItem;
