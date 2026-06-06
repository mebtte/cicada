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
  aliases: string[];
  photos?: SingerPhoto[];
}

interface Music {
  id: string;
  cover: string;
  coverThumbnail?: string;
  name: string;
  singers: Singer[];
  lyricists: Singer[];
}

type Response = Omit<Music, 'singers' | 'lyricists'> & {
  type: MusicType;
  aliases: string[];
  searchKeywords: string;
  heat: number;
  createTimestamp: number;
  forkList: Music[];
  forkFromList: Music[];
  year: number | null;
  asset: string;
  assetSize: number;
  assetDurationMs: number;
  assetCodec: string;
  assetBitRate: number;
  musicbillCount: number;
  relatedPublicMusicbillList?: {
    id: string;
    name: string;
    cover: string;
    musicCount: number;
    user: {
      id: string;
      nickname: string;
      avatar: string;
    };
  }[];
  singers: Singer[];
  lyricists: Singer[];
};

const normalizePhotos = (photos: SingerPhoto[] = []) =>
  photos.map((photo) => ({
    ...photo,
    asset: prefixServerOrigin(photo.asset),
    thumbnail: prefixServerOrigin(photo.thumbnail ?? ''),
  }));

async function adminGetMusic({
  id,
  requestMinimalDuration,
}: {
  id: string;
  requestMinimalDuration?: number;
}) {
  const music = await request<Response>({
    path: '/api/admin/music',
    params: { id },
    withToken: true,
    requestMinimalDuration,
  });
  return {
    ...music,
    aliases: music.aliases ?? [],
    searchKeywords: music.searchKeywords ?? '',
    cover: prefixServerOrigin(music.cover),
    coverThumbnail: prefixServerOrigin(music.coverThumbnail ?? ''),
    asset: prefixServerOrigin(music.asset),
    singers: (music.singers ?? []).map((singer) => {
      const photos = normalizePhotos(singer.photos);
      return {
        ...singer,
        photos,
        avatar: photos[0]?.asset ?? '',
      };
    }),
    lyricists: (music.lyricists ?? []).map((artist) => {
      const photos = normalizePhotos(artist.photos);
      return {
        ...artist,
        photos,
        avatar: photos[0]?.asset ?? '',
      };
    }),
    forkList: music.forkList.map((item) => ({
      ...item,
      cover: prefixServerOrigin(item.cover),
      coverThumbnail: prefixServerOrigin(item.coverThumbnail ?? ''),
      singers: (item.singers ?? []).map((singer) => ({
        ...singer,
        photos: normalizePhotos(singer.photos),
      })),
      lyricists: (item.lyricists ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
    })),
    forkFromList: music.forkFromList.map((item) => ({
      ...item,
      cover: prefixServerOrigin(item.cover),
      coverThumbnail: prefixServerOrigin(item.coverThumbnail ?? ''),
      singers: (item.singers ?? []).map((singer) => ({
        ...singer,
        photos: normalizePhotos(singer.photos),
      })),
      lyricists: (item.lyricists ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
    })),
    relatedPublicMusicbillList: (
      music.relatedPublicMusicbillList ?? []
    ).map((musicbill) => ({
      ...musicbill,
      cover: prefixServerOrigin(musicbill.cover),
      user: {
        ...musicbill.user,
        avatar: prefixServerOrigin(musicbill.user.avatar),
      },
    })),
  };
}

export default adminGetMusic;
