import { Language } from '@/constants/language';
import { useSetting } from '@/global_states/setting';
import type { Key } from './constants';

let translation: { [key in Key]: string };
switch (useSetting.getState().language) {
  case Language.ZH_HANS: {
    ({ default: translation } = await import('./zh_hans'));
    break;
  }
  case Language.ZH_HANT: {
    ({ default: translation } = await import('./zh_hant'));
    break;
  }
  default: {
    ({ default: translation } = await import('./en'));
  }
}

// 同步文档语言，供辅助技术和浏览器内建功能识别当前界面语言。
document.documentElement.lang = useSetting.getState().language;

export function t(key: Key, ...args: string[]) {
  let value = translation[key] || key;

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
  [Language.EN]: { label: 'English' },
  [Language.ZH_HANS]: { label: '简体中文' },
  [Language.ZH_HANT]: { label: '繁體中文' },
};

export type { Key };
