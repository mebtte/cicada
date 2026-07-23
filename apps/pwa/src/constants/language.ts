export enum Language {
  ZH_HANS = 'zh-hans',
  EN = 'en',
}
export const LANGUAGES = Object.values(Language);
export const DEFAULT_LANGUAGE = Language.EN;

export function getClientLanguage(language: Language) {
  // 本地存储沿用既有枚举值, 仅在 API 边界转换为规范的 BCP 47 标签。
  return language === Language.ZH_HANS ? 'zh-Hans' : 'en';
}
