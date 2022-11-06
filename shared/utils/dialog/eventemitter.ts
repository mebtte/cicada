import Eventin from 'eventin';
import { Alert, Confirm } from './constants';

export enum EventType {
  OPEN_ALERT = 'open_alert',
  OPEN_CONFIRM = 'open_confirm',
  CLOSE = 'close',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_ALERT]: Omit<Alert, 'type'>;
    [EventType.OPEN_CONFIRM]: Omit<Confirm, 'type'>;
    [EventType.CLOSE]: { id: string };
  }
>();
