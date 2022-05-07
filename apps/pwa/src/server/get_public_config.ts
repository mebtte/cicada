import { PublicConfigKey } from '@/constants/public_config';
import api from '.';

/**
 * 获取公共配置
 * @author mebtte<hi@mebtte.com>
 */
function getPublicConfig(key: PublicConfigKey) {
  return api.get<string>('/api/get_public_config', {
    withToken: true,
    params: { key },
  });
}

export default getPublicConfig;
