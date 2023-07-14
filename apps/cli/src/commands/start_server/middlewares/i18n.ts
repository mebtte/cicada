import { DEFAULT_LANGUAGE, Language } from '#/constants';
import { Key, t } from '@/i18n';
import { Context, Next } from 'koa';
import Negotiator from 'negotiator';

export interface I18nMiddleware {
  t: (key: Key, ...args: string[]) => string;
}

const ACCEPT_LANGUAGES = Object.values(Language);

export default (ctx: Context & I18nMiddleware, next: Next) => {
  let { lang } = ctx.query as { lang: unknown };

  // @ts-expect-error
  if (!lang || !ACCEPT_LANGUAGES.includes(lang)) {
    const negotiator = new Negotiator(ctx.request);
    lang = negotiator.language(ACCEPT_LANGUAGES);
  }

  ctx.t = (key, ...args) =>
    t(key, (lang as Language) || DEFAULT_LANGUAGE, ...args);
  return next();
};
