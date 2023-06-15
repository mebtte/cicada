import getPublicMusicbillCollectionList from '@/server/api/get_public_musicbill_collection_list';

export type Collection = AsyncReturnType<
  typeof getPublicMusicbillCollectionList
>['collectionList'][0];

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 60;
