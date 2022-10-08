import { createRoot } from 'react-dom/client';
import { Alert, Confirm } from './constants';
import e, { EventType } from './eventemitter';
import DialogApp from './dialog_app';

const root = document.createElement('div');
root.className = 'dialog-app';
document.body.appendChild(root);
createRoot(root).render(<DialogApp />);

export default {
  alert: (a: Partial<Omit<Alert, 'id' | 'type'>>) =>
    e.emit(EventType.OPEN_ALERT, a),
  confirm: (c: Partial<Omit<Confirm, 'id' | 'type'>>) =>
    e.emit(EventType.OPEN_CONFIRM, c),
};
