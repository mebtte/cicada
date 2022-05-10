import Cache from '#/utils/cache';

export enum Key {
  CAPTCHA_CODE = 'captcha_code_{{id}}',
  SEARCH_WORD = 'search_word',
}

const cache = new Cache<
  Key,
  {
    [Key.CAPTCHA_CODE]: string;
    [Key.SEARCH_WORD]: { word: string };
  }
>();

export default cache;
