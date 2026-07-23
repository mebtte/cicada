import { create } from 'zustand';
import storage, { Key } from '@/storage';
import { MusicPlaybackQuality, Setting } from '@/constants/setting';
import logger from '@/utils/logger';
import { DEFAULT_LANGUAGE, LANGUAGES, Language } from '@/constants/language';

function getInitialLanguage() {
  const language = window.navigator.language.toLowerCase();

  // 脚本标签优先；没有脚本时再按中文的常见地区标签判断。
  if (
    language.startsWith('zh-hant') ||
    ['zh-tw', 'zh-hk', 'zh-mo'].includes(language)
  ) {
    return Language.ZH_HANT;
  }
  if (
    language === 'zh' ||
    language.startsWith('zh-hans') ||
    ['zh-cn', 'zh-sg'].includes(language)
  ) {
    return Language.ZH_HANS;
  }
  return DEFAULT_LANGUAGE;
}

// Keep first-run defaults and invalid stored values on the same playback quality.
const DEFAULT_MUSIC_PLAYBACK_QUALITY = MusicPlaybackQuality.SMOOTH;
const DEFAULT_SETTING: Setting = {
  language: getInitialLanguage(),
  musicPlaybackQuality: DEFAULT_MUSIC_PLAYBACK_QUALITY,
  adminQuickEdit: false,
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

if (
  !Object.values(MusicPlaybackQuality).includes(
    useSetting.getState().musicPlaybackQuality,
  )
) {
  useSetting.setState({
    musicPlaybackQuality: DEFAULT_MUSIC_PLAYBACK_QUALITY,
  });
}

useSetting.subscribe((setting) =>
  storage
    .setItem(Key.SETTING, setting)
    .catch((error) => logger.error(error, 'Failed to store setting')),
);
