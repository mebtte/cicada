import { createRoot } from 'react-dom/client';
import { NoticeType } from './constants';
import NoticeApp from './notice_app';
import e, { EventType } from './eventemitter';

const root = document.createElement('div');
root.className = 'notice-root';
document.body.appendChild(root);
createRoot(root).render(<NoticeApp />);

export { NoticeType };
export default {
  info: (content: string, { duration = 6000 }: { duration?: number } = {}) =>
    e.emit(EventType.OPEN, { type: NoticeType.INFO, content, duration }),
  success: (content: string, { duration = 6000 }: { duration?: number } = {}) =>
    e.emit(EventType.OPEN, { type: NoticeType.SUCCESS, content, duration }),
  error: (content: string, { duration = 6000 }: { duration?: number } = {}) =>
    e.emit(EventType.OPEN, { type: NoticeType.ERROR, content, duration }),
};
