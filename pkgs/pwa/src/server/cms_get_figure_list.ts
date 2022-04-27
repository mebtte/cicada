/* eslint-disable camelcase */
import api from '.';

export enum SearchKey {
  COMPOSITE = 'composite',
  ID = 'id',
  NAME = 'name',
  ALIAS = 'alias',
}

export const SEARCH_KEY_MAP_LABEL: Record<SearchKey, string> = {
  [SearchKey.COMPOSITE]: '综合',
  [SearchKey.ID]: 'ID',
  [SearchKey.NAME]: '名字',
  [SearchKey.ALIAS]: '别名',
};

export const SEARCH_KEYS = Object.keys(SEARCH_KEY_MAP_LABEL) as SearchKey[];
export const SEARCH_VALUE_MAX_LENGTH = 50;

async function cmsGetFigureList({
  page = 1,
  pageSize = 30,
  searchKey,
  searchValue,
}: {
  page?: number;
  pageSize?: number;
  searchKey: SearchKey;
  searchValue: string;
}) {
  const data = await api.get<{
    total: number;
    list: {
      id: string;
      avatar: string;
      name: string;
      alias: string;
      create_time: string;
    }[];
  }>('/api/cms/get_figure_list', {
    withToken: true,
    params: {
      page,
      page_size: pageSize,
      search_key: searchKey,
      search_value: searchValue,
    },
  });
  return {
    total: data.total,
    list: data.list.map(
      ({
        id: figureId,
        name: fName,
        alias: fAlias,
        avatar,
        create_time: createTime,
      }) => ({
        id: figureId,
        name: fName,
        alias: fAlias,
        avatar,
        createTime: new Date(createTime),
      }),
    ),
  };
}

export default cmsGetFigureList;
