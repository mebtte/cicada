import { request } from '.';

function getMetadata() {
  return request<{ version: string }>({ path: '/api/metadata' });
}

export default getMetadata;
