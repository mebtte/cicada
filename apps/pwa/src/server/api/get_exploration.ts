import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type Response = {
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
    photos: { id: string; asset: string; description: string }[];
  }[];
  publicMusicbillList: {
    id: string;
    name: string;
    cover: string;
    user: { id: string; nickname: string };
  }[];
};

/**
 * 获取发现内容
 * @author mebtte<i@mebtte.com>
 */
async function getExploration() {
  const data = await request<Response>({
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
      photos: s.photos.map((p) => ({
        ...p,
        asset: prefixServerOrigin(p.asset),
      })),
    })),
    publicMusicbillList: data.publicMusicbillList.map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
    })),
  };
}

export default getExploration;
