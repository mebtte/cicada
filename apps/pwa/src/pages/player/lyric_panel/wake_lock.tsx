import logger from '@/utils/logger';
import { memo, useEffect, useRef } from 'react';

const WAKE_LOCK_SUPPORTED = 'wakeLock' in window.navigator;

function WakeLock() {
  const unmountedRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    (async () => {
      const wakeLock = await navigator.wakeLock.request('screen');
      if (unmountedRef.current) {
        wakeLock.release().catch((error) => {
          logger.error(error, 'Failed to release wake lock');
        });
      } else {
        wakeLockRef.current = wakeLock;
      }
    })().catch((error) => {
      logger.error(error, 'Failed to request wake lock');
    });
    return () =>
      void wakeLockRef.current?.release().catch((error) => {
        logger.error(error, 'Failed to release wake lock');
      });
  }, []);
  useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    [],
  );
  return null;
}

function Wrapper() {
  return WAKE_LOCK_SUPPORTED ? <WakeLock /> : null;
}

export default memo(Wrapper);
