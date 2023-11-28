import { useSyncExternalStore } from 'react';

function subscribeOnLineOrOffLine(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function isOnLine() {
  return window.navigator.onLine;
}

export default () => useSyncExternalStore(subscribeOnLineOrOffLine, isOnLine);
