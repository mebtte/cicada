import { Method, request } from '..';

function deleteSession(id: string) {
  return request({
    path: `/api/sessions/${window.encodeURIComponent(id)}`,
    method: Method.DELETE,
    withToken: true,
  });
}

export default deleteSession;
