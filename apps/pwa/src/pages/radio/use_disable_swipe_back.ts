import { useEffect } from 'react';
import { IS_TOUCHABLE } from '@/constants/browser';

// iOS/Safari 在左缘 touchstart 阶段挂载返回手势, 必须在 capture/non-passive
// 下 preventDefault 才能阻止. 数值与 use_open_sidebar_swipe 对齐.
const EDGE_WIDTH = 24;

function useDisableSwipeBack() {
  useEffect(() => {
    if (!IS_TOUCHABLE) {
      return;
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }
      const touch = event.touches[0];
      if (touch.clientX > EDGE_WIDTH) {
        return;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const listenerOptions: AddEventListenerOptions = {
      capture: true,
      passive: false,
    };

    document.addEventListener('touchstart', onTouchStart, listenerOptions);
    return () => {
      document.removeEventListener('touchstart', onTouchStart, listenerOptions);
    };
  }, []);
}

export default useDisableSwipeBack;
