import { useRef, useCallback } from 'react';

function useEvent<Callback extends (...args: unknown[]) => unknown>(
  callback: Callback,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const memoCallback = useCallback(
    (...args: Parameters<Callback>): ReturnType<Callback> =>
      callbackRef.current(...args) as ReturnType<Callback>,
    [],
  );

  return memoCallback as Callback;
}

export default useEvent;
