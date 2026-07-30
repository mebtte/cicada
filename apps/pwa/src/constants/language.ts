export enum Language {
  EN = 'en',
  ZH_HANS = 'zh-Hans',
  ZH_HANT = 'zh-Hant',
}
export const LANGUAGES = Object.values(Language);
export const DEFAULT_LANGUAGE = Language.EN;

export function getClientLanguage(language: Language) {
  return language;
}

export function getOrderedLanguages(selectedLanguage: Language): Language[] {
  // 当前语言固定排在首位，其余语言按规范语言 key 的英文顺序排列。
  const remainingLanguages = LANGUAGES.filter(
    (language) => language !== selectedLanguage,
  ).sort((left, right) => {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });

  return [selectedLanguage, ...remainingLanguages];
}
