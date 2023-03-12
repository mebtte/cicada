import { Method, request } from '..';

function deleteMusic(id: string) {
  return request({
    path: '/api/music',
    method: Method.DELETE,
    params: { id },
    withToken: true,
  });
}

export default deleteMusic;
