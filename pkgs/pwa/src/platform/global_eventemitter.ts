import Eventemitter from 'eventemitter3';

export enum EventType {
  OPEN_PROFILE_DIALOG = 'open_profile_dialog',
}

export default new Eventemitter<EventType>();
