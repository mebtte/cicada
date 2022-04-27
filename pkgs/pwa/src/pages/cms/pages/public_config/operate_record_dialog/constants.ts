import cmsGetPublicConfigRecordList from '@/server/cms_get_public_config_record_list';

export type Record = AsyncReturnType<
  typeof cmsGetPublicConfigRecordList
>['list'][0];

export const PAGE_SIZE = 20;
