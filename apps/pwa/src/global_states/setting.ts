import XState from '@/utils/x_state';
import storage, { Key } from '@/storage';
import { Setting } from '@/constants/setting';
import logger from '@/utils/logger';

const DEFAULT_SETTING: Setting = {
  playerVolume: 1,
};
const initialSetting = await storage.getItem(Key.SETTING);
const setting = new XState<Setting>({
  ...DEFAULT_SETTING,
  ...initialSetting,
});

setting.onChange((s) =>
  storage
    .setItem(Key.SETTING, s)
    .catch((error) => logger.error(error, '保存设置失败')),
);

export function prefixServerOrigin(path: string) {
  if (path) {
    return `${setting.get().serverOrigin || window.location.origin}${path}`;
  }
  return path;
}

export default setting;
