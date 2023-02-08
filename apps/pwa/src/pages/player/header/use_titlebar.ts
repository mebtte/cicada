import { useEffect, useState } from 'react';
import mm from '@/global_states/mini_mode';
import useTitlebarAreaRect from '@/utils/use_titlebar_area_rect';
import useWindowWidth from '@/utils/use_window_width';

const INITIAL_LEFT = 20;
const INITIAL_RIGHT = 20;

export default () => {
  const miniMode = mm.useState();
  const windowWidth = useWindowWidth();
  const rect = useTitlebarAreaRect();

  const [left, setLeft] = useState(INITIAL_LEFT);
  const [right, setRight] = useState(INITIAL_RIGHT);

  useEffect(() => {
    if (rect.left) {
      setLeft(miniMode ? rect.left + INITIAL_LEFT : INITIAL_LEFT);
    } else {
      setLeft(INITIAL_LEFT);
    }

    if (rect.right) {
      setRight(windowWidth - rect.right + INITIAL_RIGHT);
    } else {
      setRight(INITIAL_RIGHT);
    }
  }, [miniMode, rect, windowWidth]);

  return { left, right };
};
