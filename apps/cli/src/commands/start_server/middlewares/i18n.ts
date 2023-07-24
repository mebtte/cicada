import { CommonQuery, DEFAULT_LANGUAGE, Language } from '#/constants';
import { Key, t } from '@/i18n';
import { Context, Next } from 'koa';
import Negotiator from 'negotiator';

export interface I18nMiddleware {
  t: (key: Key, ...args: string[]) => string;
}

const ACCEPT_LANGUAGES = Object.values(Language);

export default (ctx: Context & I18nMiddleware, next: Next) => {
  let lang: Language | null = null;
  const getLang = () => {
    if (!lang) {
      // @ts-expect-error
      ({ __lang: lang } = ctx.query as { [CommonQuery.LANGUAGE]: unknown });
      if (!lang || !ACCEPT_LANGUAGES.includes(lang)) {
        const negotiator = new Negotiator(ctx.request);
        lang = negotiator.language(ACCEPT_LANGUAGES);
      }
      if (!lang) {
        lang = DEFAULT_LANGUAGE;
      }
    }
    return lang;
  };
  ctx.t = (key, ...args) => t(key, getLang(), ...args);

  return next();
};
