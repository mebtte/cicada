import { createRoot } from 'react-dom/client';
import { Alert, Confirm } from './constants';
import e, { EventType } from './eventemitter';
import DialogApp from './dialog_app';
import generateRandomString from '../generate_random_string';

const root = document.createElement('div');
root.className = 'dialog-app';
document.body.appendChild(root);
createRoot(root).render(<DialogApp />);

export default {
  alert: (a: Partial<Omit<Alert, 'id' | 'type'>>) => {
    const id = generateRandomString(6, false);
    e.emit(EventType.OPEN_ALERT, {
      ...a,
      id,
    });
    return id;
  },
  confirm: (c: Partial<Omit<Confirm, 'id' | 'type'>>) => {
    const id = generateRandomString(6, false);
    e.emit(EventType.OPEN_CONFIRM, {
      ...c,
      id,
    });
    return id;
  },
  close: (id: string) => e.emit(EventType.CLOSE, { id }),
};
