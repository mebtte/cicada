import Eventin from 'eventin';

export enum EventType {
  COLLECT_MUSICBILL = 'collect_musicbill',
  UNCOLLECT_MUSICBILL = 'uncollect_musicbill',
}

export default new Eventin<
  EventType,
  {
    [EventType.COLLECT_MUSICBILL]: { id: string };
    [EventType.UNCOLLECT_MUSICBILL]: { id: string };
  }
>();
