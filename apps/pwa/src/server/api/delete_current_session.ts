import { Method, request } from '..';

function deleteCurrentSession() {
  return request({
    path: '/api/common/sessions/current',
    method: Method.DELETE,
    withToken: true,
  });
}

export default deleteCurrentSession;
