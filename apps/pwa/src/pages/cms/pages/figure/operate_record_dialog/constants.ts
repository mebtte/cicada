import cmsGetFigureOperateRecordList from '@/server/cms_get_figure_operate_record_list';

export type Record = AsyncReturnType<
  typeof cmsGetFigureOperateRecordList
>['list'][0];

export const PAGE_SIZE = 20;
