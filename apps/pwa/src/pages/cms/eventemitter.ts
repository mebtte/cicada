import Eventemitter from 'eventemitter3';

export enum EventType {
  VIEW_JSON = 'view_json', // { json: Object }
}

export default new Eventemitter<EventType>();
