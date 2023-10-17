import Eventin from 'eventin';

export enum EventType {
  BEFORE_DRAG_START = 'before_drag_start',
  DRAG_END = 'drag_end',
}

export default new Eventin<
  EventType,
  {
    [EventType.BEFORE_DRAG_START]: { index: number };
    [EventType.DRAG_END]: null;
  }
>();
