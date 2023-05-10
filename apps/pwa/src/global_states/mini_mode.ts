import { MINI_MODE_MAX_WIDTH } from '@/constants';
import XState from '@/utils/x_state';
import throttle from 'lodash/throttle';

const miniMode = new XState(window.innerWidth <= MINI_MODE_MAX_WIDTH);

window.addEventListener(
  'resize',
  throttle(() => miniMode.set(window.innerWidth <= MINI_MODE_MAX_WIDTH), 300),
);

export default miniMode;
