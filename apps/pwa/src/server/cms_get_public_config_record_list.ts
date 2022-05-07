/* eslint-disable camelcase */
import { PublicConfigKey } from '@/constants/public_config';
import api from '.';

/**
 * CMS 获取公共配置操作记录列表
 * @author mebtte<hi@mebtte.com>
 */
function cmsGetPublicConfigRecordList({
  key,
  page,
  pageSize,
}: {
  key?: PublicConfigKey;
  page?: number;
  pageSize?: number;
}) {
  return api.get<{
    total: number;
    list: {
      id: number;
      operate_user: { id: string; nickname: string };
      operate_time: string;
      key: PublicConfigKey;
      value: string;
    }[];
  }>('/api/cms/get_public_config_operate_record_list', {
    withToken: true,
    params: {
      key,
      page,
      page_size: pageSize,
    },
  });
}

export default cmsGetPublicConfigRecordList;
