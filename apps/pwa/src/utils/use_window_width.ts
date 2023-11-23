import { useDeferredValue, useSyncExternalStore } from 'react';

function subscribeWindowResize(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getWindowWidth() {
  return window.innerWidth;
}

function useWindowWidth() {
  const windowWidth = useSyncExternalStore(
    subscribeWindowResize,
    getWindowWidth,
  );
  return useDeferredValue(windowWidth);
}

export default useWindowWidth;
