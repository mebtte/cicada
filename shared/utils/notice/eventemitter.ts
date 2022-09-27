import Eventin from 'eventin';
import { ReactNode } from 'react';
import { NoticeType } from './constants';

export enum EventType {
  OPEN = 'open',
  CLOSE = 'close',
  UPDATE_HEIGHT = 'update_height',
}

type EventTypeMapData = {
  [EventType.OPEN]: {
    id: string;
    type: NoticeType;
    duration: number;
    content: ReactNode;
    closable: boolean;
  };
  [EventType.CLOSE]: { id: string };
  [EventType.UPDATE_HEIGHT]: { id: string; height: number };
};

export default new Eventin<EventType, EventTypeMapData>();
