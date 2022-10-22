import Eventin from 'eventin';

export enum EventType {
  OPEN_CUSTOM_PAGE = 'open_custom_page',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_CUSTOM_PAGE]: string;
  }
>();
