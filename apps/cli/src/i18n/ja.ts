import { Key } from './constants';
import en from './en';

const ja: {
  [key in Key]: string;
} = {
  ...en,
};

export default ja;
