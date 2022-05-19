import Cache from '#/utils/cache';

export enum Key {
  CAPTCHA = 'captcha_{{id}}',
}

const cache = new Cache<
  Key,
  {
    [Key.CAPTCHA]: string;
  }
>();

export default cache;
