import searchPublicMusicbill from '@/server/search_public_musicbill';

export type Musicbill = AsyncReturnType<
  typeof searchPublicMusicbill
>['musicbillList'][0];
