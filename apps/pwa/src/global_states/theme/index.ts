import { MINI_MODE_MAX_WIDTH } from '@/constants';
import throttle from 'lodash/throttle';
import scrollbarObserver from './scrollbar_observer';
import { create } from 'zustand';
import { Theme } from '@/styled';

export const useTheme = create<Theme>(() => ({
  miniMode: window.innerWidth <= MINI_MODE_MAX_WIDTH,
  autoScrollbar: scrollbarObserver.getScrollbarWidth() === 0,
}));

window.addEventListener(
  'resize',
  throttle(
    () =>
      useTheme.setState({
        miniMode: window.innerWidth <= MINI_MODE_MAX_WIDTH,
      }),
    300,
  ),
);
scrollbarObserver.onChange(() =>
  useTheme.setState({
    autoScrollbar: scrollbarObserver.getScrollbarWidth() === 0,
  }),
);
