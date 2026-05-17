import { useEffect } from 'react';
import { useTheme } from '@/global_states/theme';
import eventemitter, { EventType } from './eventemitter';

// 判断当前是否为 macOS, 用于决定快捷键修饰键 (Mac: Cmd, 其他: Ctrl)
const isMac = /\bMac OS X\b|\bMacintosh\b/.test(window.navigator.userAgent);

/**
 * 在桌面模式下监听浏览器查找快捷键 (Mac: Cmd+F, 其他: Ctrl+F),
 * 阻止浏览器默认行为, 改为聚焦到 PWA 内部的搜索框.
 */
export default () => {
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      // 仅在桌面模式 (非 miniMode) 下接管快捷键
      if (useTheme.getState().miniMode) {
        return;
      }

      const modifier = isMac ? event.metaKey : event.ctrlKey;
      if (!modifier || event.altKey || event.shiftKey) {
        return;
      }
      if (event.key !== 'f' && event.key !== 'F') {
        return;
      }

      event.preventDefault();
      eventemitter.emit(EventType.FOCUS_SEARCH_INPUT, null);
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);
};
