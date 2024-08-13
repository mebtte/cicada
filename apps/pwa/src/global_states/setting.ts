import { create } from 'zustand';
import storage, { Key } from '@/storage';
import { Setting } from '@/constants/setting';
import logger from '@/utils/logger';
import { DEFAULT_LANGUAGE, LANGUAGES, Language } from '#/constants';

function getInitialLanguage() {
  switch (window.navigator.language.toLowerCase()) {
    case 'zh':
    case 'zh-cn': {
      return Language.ZH_HANS;
    }

    case 'ja': {
      return Language.JA;
    }

    default: {
      return DEFAULT_LANGUAGE;
    }
  }
}

const DEFAULT_SETTING: Setting = {
  playerVolume: 1,
  language: getInitialLanguage(),
};
const initialSetting = await storage.getItem(Key.SETTING);
export const useSetting = create<Setting>(() => ({
  ...DEFAULT_SETTING,
  ...initialSetting,
}));

/**
 * correct language
 * @author mebtte<i@mebtte.com>
 */
if (!LANGUAGES.includes(useSetting.getState().language)) {
  useSetting.setState({
    language: DEFAULT_LANGUAGE,
  });
}

useSetting.subscribe((setting) =>
  storage
    .setItem(Key.SETTING, setting)
    .catch((error) => logger.error(error, 'Failed to store setting')),
);
