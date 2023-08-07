import { Language } from '#/constants';
import setting from '../global_states/setting';
import type { Key } from './constants';

let translation: { [key in Key]: string };
switch (setting.get().language) {
  case Language.ZH_HANS: {
    ({ default: translation } = await import('./zh_hans'));
    break;
  }
  case Language.JA: {
    ({ default: translation } = await import('./ja'));
    break;
  }
  default: {
    ({ default: translation } = await import('./en_us'));
  }
}

export function t(key: Key, ...args: string[]) {
  let value = translation[key];

  if (args.length) {
    for (let i = 0; i < args.length; i += 1) {
      value = value.replace(`%s${i + 1}`, args[i]);
    }
  }

  return value;
}

export const LANGUAGE_MAP: Record<
  Language,
  {
    label: string;
  }
> = {
  [Language.EN_US]: { label: 'English(US)' },
  [Language.ZH_HANS]: { label: '简体中文' },
  [Language.JA]: { label: '日本語' },
};

export { Key };
