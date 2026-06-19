import { Method, request } from '..';

function deleteSession(id: string) {
  return request({
    path: `/api/common/sessions/${window.encodeURIComponent(id)}`,
    method: Method.DELETE,
    withToken: true,
  });
}

export default deleteSession;
