import { request } from '..';

function getMetadata() {
  return request<{ version: string }>({ path: '/base/metadata' });
}

export default getMetadata;
