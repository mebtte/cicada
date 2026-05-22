import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type MusicItem = {
  id: string;
  name: string;
  cover: string;
  singers: {
    id: string;
    name: string;
  }[];
};
type SingerItem = {
  id: string;
  name: string;
  photos: { id: string; asset: string; description: string }[];
};
type PublicMusicbillItem = {
  id: string;
  name: string;
  cover: string;
  user: { id: string; nickname: string };
};
type Response = {
  musicList: MusicItem[];
  singerList: SingerItem[];
  publicMusicbillList: PublicMusicbillItem[];
  recentMusicList: MusicItem[];
  recentSingerList: SingerItem[];
  recentPublicMusicbillList: PublicMusicbillItem[];
};

const normalizeMusic = (m: MusicItem) => ({
  ...m,
  cover: prefixServerOrigin(m.cover),
});
const normalizeSinger = (s: SingerItem) => ({
  ...s,
  photos: s.photos.map((p) => ({
    ...p,
    asset: prefixServerOrigin(p.asset),
  })),
});
const normalizeMusicbill = (mb: PublicMusicbillItem) => ({
  ...mb,
  cover: prefixServerOrigin(mb.cover),
});

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
    musicList: data.musicList.map(normalizeMusic),
    singerList: data.singerList.map(normalizeSinger),
    publicMusicbillList: data.publicMusicbillList.map(normalizeMusicbill),
    recentMusicList: data.recentMusicList.map(normalizeMusic),
    recentSingerList: data.recentSingerList.map(normalizeSinger),
    recentPublicMusicbillList:
      data.recentPublicMusicbillList.map(normalizeMusicbill),
  };
}

export default getExploration;
