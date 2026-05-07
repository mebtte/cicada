import { useEffect } from 'react';

const EDGE_GESTURE_WIDTH = 24;
const HORIZONTAL_MOVE_THRESHOLD = 10;
const HORIZONTAL_INTENT_RATIO = 1.4;

function isTouchable() {
  return 'ontouchstart' in window || window.navigator.maxTouchPoints > 0;
}

function isEdgeGestureStart(clientX: number) {
  return (
    clientX <= EDGE_GESTURE_WIDTH ||
    clientX >= window.innerWidth - EDGE_GESTURE_WIDTH
  );
}

function isNavigationSwipe(startX: number, deltaX: number, deltaY: number) {
  const isLeftEdgeBackSwipe = startX <= EDGE_GESTURE_WIDTH && deltaX > 0;
  const isRightEdgeForwardSwipe =
    startX >= window.innerWidth - EDGE_GESTURE_WIDTH && deltaX < 0;
  const hasHorizontalIntent =
    Math.abs(deltaX) >= HORIZONTAL_MOVE_THRESHOLD &&
    Math.abs(deltaX) > Math.abs(deltaY) * HORIZONTAL_INTENT_RATIO;

  return (
    hasHorizontalIntent && (isLeftEdgeBackSwipe || isRightEdgeForwardSwipe)
  );
}

export default function usePreventEdgeSwipeNavigation() {
  useEffect(() => {
    if (!isTouchable()) {
      return;
    }

    let shouldTrack = false;
    let startX = 0;
    let startY = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        shouldTrack = false;
        return;
      }

      const touch = event.touches[0];

      shouldTrack = isEdgeGestureStart(touch.clientX);
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!shouldTrack || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (event.cancelable && isNavigationSwipe(startX, deltaX, deltaY)) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      shouldTrack = false;
    };

    window.addEventListener('touchstart', onTouchStart, {
      capture: true,
      passive: true,
    });
    window.addEventListener('touchmove', onTouchMove, {
      capture: true,
      passive: false,
    });
    window.addEventListener('touchend', onTouchEnd, { capture: true });
    window.addEventListener('touchcancel', onTouchEnd, { capture: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, []);
}
