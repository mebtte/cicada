import { PublicConfigKey } from '@/constants/public_config';
import api from '.';

/**
 * CMS 更新公共配置
 * @author mebtte<hi@mebtte.com>
 */
function cmsUpdatePublicConfig({
  key,
  value,
}: {
  key: PublicConfigKey;
  value: string;
}) {
  return api.post<void>('/api/cms/update_public_config', {
    withToken: true,
    data: { key, value },
  });
}

export default cmsUpdatePublicConfig;
