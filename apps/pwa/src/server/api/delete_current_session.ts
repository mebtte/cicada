import { Method, request } from '..';

function deleteCurrentSession() {
  return request({
    path: '/api/sessions/current',
    method: Method.DELETE,
    withToken: true,
  });
}

export default deleteCurrentSession;
