import XState from '@/utils/x_state';
import storage, { Key } from '@/platform/storage';
import debounce from 'lodash/debounce';

const volume = new XState(Number(storage.getItem(Key.PLAYER_VOLUME)) || 1);

volume.onChange(
  debounce(
    (v) => storage.setItem({ key: Key.PLAYER_VOLUME, value: v.toString() }),
    1000,
  ),
);

export default volume;
