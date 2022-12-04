import { useEffect, useState } from 'react';
import throttle from 'lodash/throttle';

interface Rect {
  left: number;
  right: number;
  height: number;
}

const initialRect: Rect = {
  left: 0,
  right: 0,
  height: 0,
};

function useTitlebarArea() {
  const [rect, setRect] = useState<Rect>(initialRect);

  useEffect(() => {
    if ('windowControlsOverlay' in navigator) {
      // @ts-expect-error
      setRect(window.navigator.windowControlsOverlay.getTitlebarAreaRect());

      const onGeometryChange = throttle(
        () =>
          // @ts-expect-error
          setRect(window.navigator.windowControlsOverlay.getTitlebarAreaRect()),
        300,
      );
      // @ts-expect-error
      window.navigator.windowControlsOverlay.addEventListener(
        'geometrychange',
        onGeometryChange,
      );
      return () =>
        // @ts-expect-error
        window.navigator.windowControlsOverlay.removeEventListener(
          'geometrychange',
          onGeometryChange,
        );
    }
  }, []);

  return rect;
}

export default useTitlebarArea;
