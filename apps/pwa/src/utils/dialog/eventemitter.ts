import Eventin from 'eventin';
import { DialogOptions } from './constants';

export enum EventType {
  OPEN = 'open',
  CLOSE = 'close',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN]: DialogOptions;
    [EventType.CLOSE]: { id: string };
  }
>();
