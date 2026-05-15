import useWindowWidth from './use_window_width';
import useTitlebarAreaRect from './use_titlebar_area_rect';

function useTitlebarOverlayInsets() {
  const windowWidth = useWindowWidth();
  const rect = useTitlebarAreaRect();
  const right = rect.right ? Math.max(windowWidth - rect.right, 0) : 0;

  // The titlebar rect is the safe area; anything outside it can cover app UI.
  return {
    top: rect.height,
    left: rect.left,
    right,
    windowWidth,
  };
}

export default useTitlebarOverlayInsets;
