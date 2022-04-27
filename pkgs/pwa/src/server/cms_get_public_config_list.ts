import { PublicConfigKey } from '@/constants/public_config';
import api from '.';

/**
 * 获取公共配置列表
 * @author mebtte<hi@mebtte.com>
 */
function cmsGetPublicConfigList() {
  return api.get<
    {
      key: PublicConfigKey;
      value: string;
      description: string;
    }[]
  >('/api/cms/get_public_config_list', {
    withToken: true,
  });
}

export default cmsGetPublicConfigList;
