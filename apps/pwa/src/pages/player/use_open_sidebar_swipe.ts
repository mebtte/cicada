import { useEffect, useRef } from 'react';
import { IS_TOUCHABLE } from '@/constants/browser';
import { useTheme } from '@/global_states/theme';
import e, { EventType } from './eventemitter';

// 参考 Ionic/MUI 侧栏手势: 只接管最左侧窄热区, 避免影响列表滚动和页面交互。
const EDGE_WIDTH = 24;
const OPEN_DISTANCE = 48;
const MAX_VERTICAL_DRIFT = 40;
const HORIZONTAL_DOMINANCE = 1.4;

const INTERACTIVE_SELECTOR = [
  'input',
  'textarea',
  'select',
  'button',
  'a',
  '[role="button"]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
].join(',');

type SwipeState = {
  opened: boolean;
  startX: number;
  startY: number;
  tracking: boolean;
};

const createSwipeState = (): SwipeState => ({
  opened: false,
  startX: 0,
  startY: 0,
  tracking: false,
});

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function preventDefault(event: TouchEvent) {
  if (event.cancelable) {
    event.preventDefault();
  }
}

function useOpenSidebarSwipe() {
  const miniMode = useTheme((s) => s.miniMode);
  const swipeStateRef = useRef<SwipeState>(createSwipeState());

  useEffect(() => {
    if (!miniMode || !IS_TOUCHABLE) {
      swipeStateRef.current = createSwipeState();
      return;
    }

    const reset = () => {
      swipeStateRef.current = createSwipeState();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        reset();
        return;
      }

      const touch = event.touches[0];
      if (touch.clientX > EDGE_WIDTH) {
        reset();
        return;
      }

      swipeStateRef.current = {
        opened: false,
        startX: touch.clientX,
        startY: touch.clientY,
        tracking: true,
      };

      // iOS/Safari 会在 touchstart 阶段抢占左缘返回手势, 候选手势需提前取消默认行为。
      preventDefault(event);
    };

    const onTouchMove = (event: TouchEvent) => {
      const state = swipeStateRef.current;
      if (!state.tracking) {
        return;
      }

      if (event.touches.length !== 1) {
        reset();
        return;
      }

      preventDefault(event);

      const touch = event.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaY > MAX_VERTICAL_DRIFT) {
        reset();
        return;
      }

      if (deltaX <= 0) {
        return;
      }

      if (
        !state.opened &&
        deltaX >= OPEN_DISTANCE &&
        deltaX > absDeltaY * HORIZONTAL_DOMINANCE
      ) {
        swipeStateRef.current = { ...state, opened: true };
        // 横向意图确认后立即打开侧边栏, 避免等到 touchend 时浏览器已触发后退。
        e.emit(EventType.MINI_MODE_OPEN_SIDEBAR, null);
      }
    };

    const listenerOptions: AddEventListenerOptions = {
      capture: true,
      passive: false,
    };

    document.addEventListener('touchstart', onTouchStart, listenerOptions);
    document.addEventListener('touchmove', onTouchMove, listenerOptions);
    document.addEventListener('touchend', reset, { capture: true });
    document.addEventListener('touchcancel', reset, { capture: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart, listenerOptions);
      document.removeEventListener('touchmove', onTouchMove, listenerOptions);
      document.removeEventListener('touchend', reset, { capture: true });
      document.removeEventListener('touchcancel', reset, { capture: true });
    };
  }, [miniMode]);
}

export default useOpenSidebarSwipe;
