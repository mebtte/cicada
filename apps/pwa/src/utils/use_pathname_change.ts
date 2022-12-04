import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useEvent from './use_event';

function usePathnameChange(callback: (pathname: string) => void) {
  const { pathname } = useLocation();
  const callbackWrapper = useEvent(callback);
  useEffect(() => {
    callbackWrapper(pathname);
  }, [callbackWrapper, pathname]);
}

export default usePathnameChange;
