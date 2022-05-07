/* eslint-disable camelcase */
import api from '.';

export enum SearchKey {
  COMPOSITE = 'composite',
  ID = 'id',
  EMAIL = 'email',
  NICKNAME = 'nickname',
  REMARK = 'remark',
}

export const SEARCH_KEY_MAP: Record<SearchKey, { label: string }> = {
  [SearchKey.COMPOSITE]: {
    label: '综合',
  },
  [SearchKey.ID]: {
    label: 'ID',
  },
  [SearchKey.EMAIL]: {
    label: '邮箱',
  },
  [SearchKey.NICKNAME]: {
    label: '昵称',
  },
  [SearchKey.REMARK]: {
    label: '备注',
  },
};

export const SEARCH_KEYS = Object.keys(SEARCH_KEY_MAP) as SearchKey[];

export const SEARCH_VALUE_MAX_LENGTH = 50;

/**
 * CMS 获取用户列表
 * @author mebtte<hi@mebtte.com>
 */
async function cmsGetUserList({
  page,
  pageSize,
  searchKey,
  searchValue,
}: {
  page?: number;
  pageSize?: number;
  searchKey: SearchKey;
  searchValue: string;
}) {
  return api.get<{
    total: number;
    list: {
      id: string;
      email: string;
      nickname: string;
      remark: string;
      disabled: 0 | 1;
      condition: string;
      avatar: string;
      join_time: string;
      cms: 0 | 1;
    }[];
  }>('/api/cms/get_user_list', {
    withToken: true,
    params: {
      page,
      page_size: pageSize,
      search_key: searchKey,
      search_value: searchValue,
    },
  });
}

export default cmsGetUserList;
