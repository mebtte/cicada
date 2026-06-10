import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface SingerPhoto {
  id: string;
  asset: string;
  thumbnail?: string;
  description: string;
}

interface Singer {
  id: string;
  name: string;
  aliases?: string[];
  photos?: SingerPhoto[];
}

interface RawMusic {
  id: string;
  cover: string;
  coverThumbnail?: string;
  name: string;
  type: MusicType;
  aliases: string[];
  asset: string;
  assetSize: number;
  assetDurationMs: number;
  assetCodec: string;
  assetBitRate: number;
  heat: number;
  createTimestamp: number;
  year: number | null;
  singers: (Singer & { aliases: string[] })[];
  lyricists: (Singer & { aliases: string[] })[];
  composers: (Singer & { aliases: string[] })[];
}

const normalizePhotos = (photos: SingerPhoto[] = []) =>
  photos.map((p) => ({
    ...p,
    asset: prefixServerOrigin(p.asset),
    thumbnail: prefixServerOrigin(p.thumbnail ?? ''),
  }));

const normalizeArtist = <T extends Singer & { aliases: string[] }>(artist: T) => {
  const photos = normalizePhotos(artist.photos);
  return {
    ...artist,
    aliases: artist.aliases ?? [],
    photos,
    avatar: photos[0]?.asset ?? '',
  };
};

/**
 * 获取一首随机音乐 (电台模式).
 * excludeId 用于避免连续推荐同一首.
 */
async function getRandomMusic({ excludeId }: { excludeId?: string } = {}) {
  const music = await request<RawMusic>({
    path: '/api/music/random',
    params: excludeId ? { excludeId } : undefined,
    withToken: true,
  });
  return {
    ...music,
    cover: prefixServerOrigin(music.cover),
    coverThumbnail: prefixServerOrigin(music.coverThumbnail ?? ''),
    asset: prefixServerOrigin(music.asset),
    singers: (music.singers ?? []).map(normalizeArtist),
    lyricists: (music.lyricists ?? []).map(normalizeArtist),
    composers: (music.composers ?? []).map(normalizeArtist),
  };
}

export type RandomMusic = Awaited<ReturnType<typeof getRandomMusic>>;

export default getRandomMusic;
