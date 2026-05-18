/**
 * 禁止用户缩放页面
 * iOS Safari 会忽略 viewport 的 user-scalable=no, 需要在 JS 层面拦截手势
 */

// 拦截双指捏合缩放 (iOS Safari 私有事件)
document.addEventListener('gesturestart', (event) => event.preventDefault());
document.addEventListener('gesturechange', (event) => event.preventDefault());
document.addEventListener('gestureend', (event) => event.preventDefault());

// 拦截双击缩放
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false },
);
