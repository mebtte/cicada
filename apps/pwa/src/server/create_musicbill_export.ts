import { Method, request } from '.';

function createMusicbillExport(id: string) {
  return request({
    path: '/api/musicbill_export',
    method: Method.POST,
    body: { id },
    withToken: true,
  });
}

export default createMusicbillExport;
