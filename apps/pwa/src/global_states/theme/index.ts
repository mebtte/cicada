import { MINI_MODE_MAX_WIDTH } from '@/constants';
import XState from '@/utils/x_state';
import throttle from 'lodash/throttle';
import scrollbarObserver from './scrollbar_observer';
import type { DefaultTheme } from 'styled-components';

const theme = new XState<DefaultTheme>({
  miniMode: window.innerWidth <= MINI_MODE_MAX_WIDTH,
  autoScrollbar: scrollbarObserver.getScrollbarWidth() === 0,
});

window.addEventListener(
  'resize',
  throttle(
    () =>
      theme.set((t) => ({
        ...t,
        miniMode: window.innerWidth <= MINI_MODE_MAX_WIDTH,
      })),
    300,
  ),
);
scrollbarObserver.onChange(() =>
  theme.set((t) => ({
    ...t,
    autoScrollbar: scrollbarObserver.getScrollbarWidth() === 0,
  })),
);

export default theme;
