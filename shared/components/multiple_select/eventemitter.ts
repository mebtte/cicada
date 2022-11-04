import Eventin from 'eventin';
import { Option } from './constants';

export enum EventType {
  ON_CHANGE = 'on_change',
}

export default new Eventin<
  EventType,
  {
    [EventType.ON_CHANGE]: {
      id: string;
      option: Option<unknown>;
    };
  }
>();
