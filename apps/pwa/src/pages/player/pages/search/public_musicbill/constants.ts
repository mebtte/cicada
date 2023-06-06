import searchPublicMusicbill from '@/server/api/search_public_musicbill';

export type Musicbill = AsyncReturnType<
  typeof searchPublicMusicbill
>['musicbillList'][0];
