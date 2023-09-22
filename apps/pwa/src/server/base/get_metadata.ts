import { Response } from '#/server/base/get_metadata';
import { request } from '..';

function getMetadata() {
  return request<Response>({ path: '/base/metadata' });
}

export default getMetadata;
