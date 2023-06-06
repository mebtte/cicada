import Eventin from 'eventin';
import { Dialog } from './constants';

export enum EventType {
  OPEN = 'open',
  CLOSE = 'close',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN]: Dialog;
    [EventType.CLOSE]: { id: string };
  }
>();
