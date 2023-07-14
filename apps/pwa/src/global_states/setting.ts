import XState from '@/utils/x_state';
import storage, { Key } from '@/storage';
import { Setting } from '@/constants/setting';
import logger from '@/utils/logger';
import { DEFAULT_LANGUAGE, Language } from '#/constants';

function getInitialLanguage() {
  if (
    // @ts-expect-error
    Object.values(Language).includes(window.navigator.language.toLowerCase())
  ) {
    return window.navigator.language.toLowerCase() as Language;
  }
  return DEFAULT_LANGUAGE;
}

const DEFAULT_SETTING: Setting = {
  playerVolume: 1,
  language: getInitialLanguage(),
};
const initialSetting = await storage.getItem(Key.SETTING);
const setting = new XState<Setting>({
  ...DEFAULT_SETTING,
  ...initialSetting,
});

setting.onChange((s) =>
  storage
    .setItem(Key.SETTING, s)
    .catch((error) => logger.error(error, 'Fail to save setting')),
);

export function prefixServerOrigin(path: string) {
  if (path) {
    return `${setting.get().serverOrigin || window.location.origin}${path}`;
  }
  return path;
}

export default setting;
