import { ORIGINAL_SCROLLBAR_WIDTH } from '@/constants';
import scrollbarAlways from './scrollbar_always';

const scrollbarAsNeeded = ORIGINAL_SCROLLBAR_WIDTH > 0 ? scrollbarAlways : null;

export default scrollbarAsNeeded;
