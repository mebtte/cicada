import Eventemitter from 'eventemitter3';

export enum EventType {
  OPEN_SETTING_DIALOG = 'open_setting_dialog',
}

export default new Eventemitter<EventType>();
