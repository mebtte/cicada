import Eventin from 'eventin';
import { User } from './constants';

export enum EventType {
  RELOAD_DATA = 'reload_data',
  OPEN_CREATE_USER_DIALOG = 'open_create_user_dialog',
  OPEN_USER_EDIT_DRAWER = 'open_user_edit_drawer',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
}

export default new Eventin<
  EventType,
  {
    [EventType.OPEN_CREATE_USER_DIALOG]: null;
    [EventType.RELOAD_DATA]: null;
    [EventType.OPEN_USER_EDIT_DRAWER]: { user: User };
    [EventType.USER_UPDATED]: NonNullable<Partial<User>> & {
      id: string;
    };
    [EventType.USER_DELETED]: { id: string };
  }
>();
