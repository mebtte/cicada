import { type NavigateOptions, type To, useNavigate } from 'react-router-dom';
import { useTheme } from '@/global_states/theme';
import useEvent from '@/utils/use_event';
import e, { EventType } from '../eventemitter';

const NAVIGATE_AFTER_CLOSE_FRAME_COUNT = 2;

function runAfterAnimationFrames(callback: () => void, frameCount: number) {
  let currentFrame = 0;

  const run = () => {
    currentFrame += 1;

    if (currentFrame >= frameCount) {
      callback();
      return;
    }

    window.requestAnimationFrame(run);
  };

  window.requestAnimationFrame(run);
}

function useSidebarNavigate() {
  const navigate = useNavigate();
  const { miniMode } = useTheme();

  return useEvent((to: To, options?: NavigateOptions) => {
    if (!miniMode) {
      navigate(to, options);
      return;
    }

    e.emit(EventType.MINI_MODE_CLOSE_SIDEBAR, null);
    // 窄屏侧滑可在播放详情 (歌词面板) 之上呼出侧边栏, 点击菜单后若仅关闭侧边栏,
    // 歌词面板仍会遮挡新页面直到自身退出动画结束, 这里同步关闭以让目标页面立即可见
    e.emit(EventType.TOGGLE_LYRIC_PANEL, { open: false });
    runAfterAnimationFrames(
      () => navigate(to, options),
      NAVIGATE_AFTER_CLOSE_FRAME_COUNT,
    );
  });
}

export default useSidebarNavigate;
