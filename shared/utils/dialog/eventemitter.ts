import Eventin from 'eventin';
import { Alert, Confirm } from './constants';

export enum EventType {
  OPEN_ALERT = 'open_alert',
  OPEN_CONFIRM = 'open_confirm',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_ALERT]: Partial<Omit<Alert, 'id' | 'type'>>;
    [EventType.OPEN_CONFIRM]: Partial<Omit<Confirm, 'id' | 'type'>>;
  }
>();
