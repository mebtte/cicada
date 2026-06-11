import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type MusicItem = {
  id: string;
  name: string;
  cover: string;
  coverThumbnail?: string;
  performers: {
    id: string;
    name: string;
  }[];
};
type ArtistItem = {
  id: string;
  name: string;
  photos: { id: string; asset: string; thumbnail?: string; description: string }[];
};
type PublicMusicbillItem = {
  id: string;
  name: string;
  cover: string;
  user: { id: string; nickname: string };
};
type Response = {
  musicList: MusicItem[];
  artistList: ArtistItem[];
  publicMusicbillList: PublicMusicbillItem[];
  recentMusicList: MusicItem[];
  recentArtistList: ArtistItem[];
  recentPublicMusicbillList: PublicMusicbillItem[];
};

const normalizeMusic = (m: MusicItem) => ({
  ...m,
  cover: prefixServerOrigin(m.cover),
  coverThumbnail: prefixServerOrigin(m.coverThumbnail ?? ''),
});
const normalizeArtist = (artist: ArtistItem) => ({
  ...artist,
  photos: artist.photos.map((p) => ({
    ...p,
    asset: prefixServerOrigin(p.asset),
    thumbnail: prefixServerOrigin(p.thumbnail ?? ''),
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
    artistList: data.artistList.map(normalizeArtist),
    publicMusicbillList: data.publicMusicbillList.map(normalizeMusicbill),
    recentMusicList: data.recentMusicList.map(normalizeMusic),
    recentArtistList: data.recentArtistList.map(normalizeArtist),
    recentPublicMusicbillList:
      data.recentPublicMusicbillList.map(normalizeMusicbill),
  };
}

export default getExploration;
