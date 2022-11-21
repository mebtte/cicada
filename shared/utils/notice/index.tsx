import { createRoot } from 'react-dom/client';
import { ReactNode } from 'react';
import { NoticeType } from './constants';
import NoticeApp from './notice_app';
import e, { EventType } from './eventemitter';
import generateRandomString from '../generate_random_string';

const root = document.createElement('div');
root.className = 'notice-app';
document.body.appendChild(root);
createRoot(root).render(<NoticeApp />);

function generateType(type: NoticeType) {
  return (
    content: ReactNode,
    {
      duration = 5000,
      closable = true,
    }: {
      duration?: number;
      closable?: boolean;
    } = {},
  ) => {
    const id = generateRandomString();

    e.emit(EventType.OPEN, { id, type, duration, content, closable });

    return id;
  };
}

export { NoticeType };
export default {
  info: generateType(NoticeType.INFO),
  error: generateType(NoticeType.ERROR),
  close: (id: string) => e.emit(EventType.CLOSE, { id }),
};
