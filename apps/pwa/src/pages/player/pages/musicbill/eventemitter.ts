import Eventin from 'eventin';

export enum EventType {
  OPEN_EDIT_MENU = 'open_edit_menu',
  KEYWORD_CHANGE = 'keyword_change',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_EDIT_MENU]: null;
    [EventType.KEYWORD_CHANGE]: { keyword: string };
  }
>();
