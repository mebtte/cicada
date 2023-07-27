import { Language } from '#/constants';
import { Key } from './constants';
import en from './en';
import zhHans from './zh_hans';
import ja from './ja';

const LANGUAGE_MAP: Record<Language, typeof en> = {
  [Language.EN]: en,
  [Language.ZH_HANS]: zhHans,
  [Language.JA]: ja,
};

export function t(key: Key, language: Language, ...args: string[]) {
  let value = LANGUAGE_MAP[language][key];

  if (args.length) {
    for (let i = 0; i < args.length; i += 1) {
      value = value.replace(`%s${i + 1}`, args[i]);
    }
  }

  return value;
}

export { Key };
