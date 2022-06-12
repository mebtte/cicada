import { Method, request } from '.';

function createMusicbill(name: string) {
  return request<string>({
    method: Method.POST,
    path: '/api/musicbill',
    body: { name },
    withToken: true,
  });
}

export default createMusicbill;
