import { useEffect, useState } from 'react';
import throttle from 'lodash/throttle';

function getWindowWidth() {
  return window.innerWidth;
}

function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState(getWindowWidth);

  useEffect(() => {
    const onResize = throttle(() => setWindowWidth(getWindowWidth()), 300);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return windowWidth;
}

export default useWindowWidth;
