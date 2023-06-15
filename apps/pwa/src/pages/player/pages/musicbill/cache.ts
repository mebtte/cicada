import Cache from '#/utils/cache';

export enum CacheKey {
  MUSICBILL_PAGE_SCROLL_TOP = 'musicbill_page_scroll_top_{{id}}',
}

export default new Cache<
  CacheKey,
  {
    [CacheKey.MUSICBILL_PAGE_SCROLL_TOP]: number;
  }
>();
