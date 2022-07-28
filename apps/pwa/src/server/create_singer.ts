import { request, Method } from '.';

function createSinger({ name, force }: { name: string; force: boolean }) {
  return request<string>({
    path: '/api/singer',
    method: Method.POST,
    body: { name, force },
    withToken: true,
  });
}

export default createSinger;
