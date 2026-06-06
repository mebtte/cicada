import { request, Method } from '..';

function createArtist({ name, force }: { name: string; force: boolean }) {
  return request<string>({
    path: '/api/admin/artist',
    method: Method.POST,
    body: { name, force },
    withToken: true,
  });
}

export default createArtist;
