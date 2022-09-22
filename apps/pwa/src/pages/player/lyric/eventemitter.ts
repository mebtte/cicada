import Eventin from 'eventin';

export enum EventType {
  SCROLL_TO_CURRENT_LINE = 'scroll_to_current_line',
}

export default new Eventin<
  EventType,
  {
    [EventType.SCROLL_TO_CURRENT_LINE]: null;
  }
>();
