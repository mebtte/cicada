import { request } from '..';

function getSelfSingerList() {
  return request<
    {
      id: string;
      name: string;
      aliases: string[];
      createTimestamp: number;
      musicCount: number;
    }[]
  >({ path: '/api/self_singer_list', withToken: true });
}

export default getSelfSingerList;
