import { Key } from './constants';
import enUS from './en_us';

export default {
  ...enUS,
} as {
  [key in Key]: string;
};
