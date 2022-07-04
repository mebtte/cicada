import storage, { Key } from '@/platform/storage';
import XState from '#/utils/x_state';

interface Setting {
  serverAddress: string;
}

const DEFAULT_SETTING: Setting = {
  serverAddress: window.location.origin,
};
let initialSetting: Setting | null = null;
const settingString = storage.getItem(Key.SETTING);
if (settingString) {
  try {
    initialSetting = JSON.parse(settingString);
  } catch (error) {
    console.error(error);
  }
}

const setting = new XState<Setting>({
  ...DEFAULT_SETTING,
  ...initialSetting,
});

setting.onChange((s) =>
  storage.setItem({ key: Key.SETTING, value: JSON.stringify(s) }),
);

export default setting;
