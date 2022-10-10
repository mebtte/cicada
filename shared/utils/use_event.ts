import { useRef, useCallback } from 'react';

function useEvent<Callback extends (...args: unknown[]) => unknown>(
  callback: Callback,
) {
  const callbackRef = useRef<Callback>();
  callbackRef.current = callback;

  const memoCallback: Callback = useCallback(
    // @ts-expect-error
    (...args) => callbackRef.current!(...args),
    [],
  );

  return memoCallback;
}

export default useEvent;
