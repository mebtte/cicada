import logger from '#/utils/logger';
import XState from '#/utils/x_state';
import storage, { Key } from '@/storage';
import debounce from 'lodash/debounce';

const initialPlayerVolume = await storage.getItem(Key.PLAYER_VOLUME);
const playerVolume = new XState(initialPlayerVolume || 1);

playerVolume.onChange(
  debounce(
    (v) =>
      storage
        .setItem(Key.PLAYER_VOLUME, v)
        .catch((error) => logger.error(error, '保存播放器音量失败')),
    1000,
  ),
);

export default playerVolume;
