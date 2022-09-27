import Eventin from 'eventin';
import { NoticeType } from './constants';

export enum EventType {
  OPEN = 'open',
  CLOSE = 'close',
  UPDATE_HEIGHT = 'update_height',
}

type EventTypeMapData = {
  [EventType.OPEN]: { type: NoticeType; duration: number; content: string };
  [EventType.CLOSE]: { id: string };
  [EventType.UPDATE_HEIGHT]: { id: string; height: number };
};

export default new Eventin<EventType, EventTypeMapData>();
