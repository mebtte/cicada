import setting from '@/global_states/setting';
import { Method, request } from '.';

function createMusicbillExport(id: string) {
  return request({
    path: '/api/musicbill_export',
    method: Method.POST,
    body: {
      id,
      accessOrigin: setting.get().serverOrigin || window.location.origin,
    },
    withToken: true,
  });
}

export default createMusicbillExport;
