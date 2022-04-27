import cmsGetMusicOperateRecordList from '@/server/cms_get_music_operate_record_list';

export type Record = AsyncReturnType<
  typeof cmsGetMusicOperateRecordList
>['list'][0];

export const PAGE_SIZE = 20;
