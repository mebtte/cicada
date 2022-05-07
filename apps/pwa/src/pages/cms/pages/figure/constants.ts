export interface Figure {
  id: string;
  avatar: string;
  name: string;
  alias: string;
  createTime: Date;
}

export enum Query {
  PAGE = 'page',
  SEARCH_KEY = 'search_key',
  SEARCH_VALUE = 'search_value',

  CREATE_DIALOG_OPEN = 'create_dialog_open',

  OPERATE_RECORD_DIALOG_OPEN = 'operate_record_dialog_open',
  OPERATE_RECORD_DIALOG_SEARCH_FIGURE_ID = 'operate_record_dialog_search_figure_id',
}

export const PAGE_SIZE = 20;
