import Eventin from 'eventin';
import { User } from './constants';

export enum EventType {
  RELOAD_DATA = 'reload_data',
  OPEN_CREATE_USER_DIALOG = 'open_create_user_dialog',
  OPEN_EDIT_MENU = 'open_edit_menu',
  OPEN_USER_DETAIL = 'open_user_detail',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_CREATE_USER_DIALOG]: null;
    [EventType.RELOAD_DATA]: null;
    [EventType.OPEN_EDIT_MENU]: { user: User };
    [EventType.OPEN_USER_DETAIL]: { user: User };
  }
>();
