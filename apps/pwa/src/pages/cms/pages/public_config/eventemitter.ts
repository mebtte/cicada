import Eventemitter from 'eventemitter3';

export enum EventType {
  PUBLIC_CONFIG_UPDATED = 'public_config_updated',

  OPEN_UPDATE_DIALOG = 'open_update_dialog',
}

export default new Eventemitter<EventType>();
