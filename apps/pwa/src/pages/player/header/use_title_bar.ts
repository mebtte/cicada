import { useEffect, useState } from 'react';
import throttle from 'lodash/throttle';
import mm from '@/global_states/mini_mode';

const INITIAL_LEFT = 20;
const INITIAL_RIGHT = 20;

export default () => {
  const miniMode = mm.useState();

  const [left, setLeft] = useState(INITIAL_LEFT);
  const [right, setRight] = useState(INITIAL_RIGHT);

  useEffect(() => {
    if ('windowControlsOverlay' in navigator) {
      const initialRect =
        // @ts-expect-error
        window.navigator.windowControlsOverlay.getTitlebarAreaRect();
      if (initialRect.left) {
        setLeft(miniMode ? initialRect.left + INITIAL_LEFT : INITIAL_LEFT);
      }
      if (initialRect.right) {
        setRight(window.innerWidth - initialRect.right + INITIAL_RIGHT);
      }

      const onGeometryChange = throttle(() => {
        const rect =
          // @ts-expect-error
          window.navigator.windowControlsOverlay.getTitlebarAreaRect();

        if (rect.left) {
          setLeft(miniMode ? rect.left + INITIAL_LEFT : INITIAL_LEFT);
        } else {
          setLeft(INITIAL_LEFT);
        }

        if (rect.right) {
          setRight(window.innerWidth - rect.right + INITIAL_RIGHT);
        } else {
          setRight(INITIAL_RIGHT);
        }
      }, 300);
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
  }, [miniMode]);

  return { left, right };
};
