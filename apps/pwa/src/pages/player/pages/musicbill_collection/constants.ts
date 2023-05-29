import getSelfMusicbillCollectionList from '@/server/api/get_self_musicbill_collection_list';

export type Musicbill = AsyncReturnType<
  typeof getSelfMusicbillCollectionList
>['musicbillList'][0];

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 60;
