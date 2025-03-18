import { useEffect, useRef } from 'react';

function useUnmount<Callback extends () => void>(callback: Callback) {
  const callbackRef = useRef<Callback>(callback);
  callbackRef.current = callback;
  useEffect(() => callbackRef.current, []);
}

export default useUnmount;
