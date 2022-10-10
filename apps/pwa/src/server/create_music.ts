import { MusicType } from '#/constants/music';
import { Method, request } from '.';

function createMusic({
  name,
  singerIds,
  type,
  sq,
}: {
  name: string;
  singerIds: string[];
  type: MusicType;
  sq: string;
}) {
  return request<string>({
    method: Method.POST,
    path: '/api/music',
    body: { name, singerIds: singerIds.join(','), type, sq },
    withToken: true,
  });
}

export default createMusic;
