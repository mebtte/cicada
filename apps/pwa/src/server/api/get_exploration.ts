import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function getExploration() {
  const data = await request<{
    musicList: {
      id: string;
      name: string;
      cover: string;
      singers: {
        id: string;
        name: string;
      }[];
    }[];
    singerList: {
      id: string;
      name: string;
      aliases: string[];
      avatar: string;
    }[];
    musicbillList: {
      id: string;
      name: string;
      cover: string;
      user: { id: string; nickname: string };
    }[];
  }>({
    path: '/api/exploration',
    withToken: true,
  });
  return {
    musicList: data.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
    })),
    singerList: data.singerList.map((s) => ({
      ...s,
      avatar: prefixServerOrigin(s.avatar),
    })),
    musicbillList: data.musicbillList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
    })),
  };
}

export default getExploration;
