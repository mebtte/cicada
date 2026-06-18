import { Method, request } from '..';

function updateSession({
  id,
  deviceName,
}: {
  id: string;
  deviceName: string;
}) {
  return request({
    path: `/api/common/sessions/${window.encodeURIComponent(id)}`,
    method: Method.PUT,
    body: { deviceName },
    withToken: true,
  });
}

export default updateSession;
