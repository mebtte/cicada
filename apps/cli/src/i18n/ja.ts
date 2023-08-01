import { Key } from './constants';
import enUS from './en_us';

const ja: {
  [key in Key]: string;
} = {
  ...enUS,
};

export default ja;
