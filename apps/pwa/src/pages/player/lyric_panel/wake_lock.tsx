import logger from '@/utils/logger';
import { memo, useEffect, useRef } from 'react';

const WAKE_LOCK_SUPPORTED = 'wakeLock' in window.navigator;

function WakeLock() {
  const unmountedRef = useRef(false);
  // eslint-disable-next-line no-undef
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        if (unmountedRef.current) {
          wakeLock.release();
        } else {
          wakeLockRef.current = wakeLock;
        }
      } catch (error) {
        logger.error(error, 'Failed to request wake lock');
      }
    })();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
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
