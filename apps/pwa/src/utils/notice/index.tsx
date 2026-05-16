import { createRoot, Root } from 'react-dom/client';
import { ReactNode } from 'react';
import generateRandomString from '@/utils/generate_random_string';
import { NoticeType } from './constants';
import NoticeApp from './notice_app';
import e, { EventType } from './eventemitter';

const GLOBAL_KEY = '__cicada_notice_app__';
const globalStore = globalThis as typeof globalThis & {
  [GLOBAL_KEY]?: { domRoot: HTMLDivElement; reactRoot: Root };
};
const hot = (import.meta as ImportMeta & {
  hot?: { dispose: (callback: () => void) => void };
}).hot;

if (!globalStore[GLOBAL_KEY]) {
  const domRoot = document.createElement('div');
  domRoot.className = 'notice-app';
  document.body.appendChild(domRoot);

  const reactRoot = createRoot(domRoot);
  reactRoot.render(<NoticeApp />);
  globalStore[GLOBAL_KEY] = { domRoot, reactRoot };
}

if (hot) {
  hot.dispose(() => {
    const noticeApp = globalStore[GLOBAL_KEY];
    if (noticeApp) {
      noticeApp.reactRoot.unmount();
      noticeApp.domRoot.remove();
      delete globalStore[GLOBAL_KEY];
    }
  });
}

function generateType(type: NoticeType) {
  return (
    content: ReactNode,
    {
      duration = 5000,
      closable = true,
      showTypeIcon = true,
    }: {
      duration?: number;
      closable?: boolean;
      showTypeIcon?: boolean;
    } = {},
  ) => {
    const id = generateRandomString();

    e.emit(EventType.OPEN, {
      id,
      type,
      duration,
      content,
      closable,
      showTypeIcon,
    });

    return id;
  };
}

export { NoticeType };
export default {
  info: generateType(NoticeType.INFO),
  error: generateType(NoticeType.ERROR),
  close: (id: string) => e.emit(EventType.CLOSE, { id }),
};
