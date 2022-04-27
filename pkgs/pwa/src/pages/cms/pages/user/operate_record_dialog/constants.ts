import cmsGetUserOperateRecordList from '@/server/cms_get_user_operate_record_list';

export type Record = AsyncReturnType<
  typeof cmsGetUserOperateRecordList
>['list'][0];

export const PAGE_SIZE = 20;
