import { Language } from '#/constants';
import { Key } from './constants';
import enUS from './en_us';
import zhCN from './zh_cn';

const LANGUAGE_MAP: Record<Language, typeof enUS> = {
  [Language.EN_US]: enUS,
  [Language.ZH_CN]: zhCN,
};

export function t(key: Key, language: Language, ...args: string[]) {
  const value = LANGUAGE_MAP[language][key];

  if (args) {
    for (const arg of args) {
      value.replace('%s', arg);
    }
  }

  return value;
}

export { Key };
