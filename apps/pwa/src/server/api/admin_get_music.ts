import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface ArtistPhoto {
  id: string;
  asset: string;
  thumbnail?: string;
  description: string;
}

interface Performer {
  id: string;
  name: string;
  aliases: string[];
  photos?: ArtistPhoto[];
}

interface Music {
  id: string;
  cover: string;
  coverThumbnail?: string;
  name: string;
  performers: Performer[];
  lyricists: Performer[];
  composers: Performer[];
}

type Response = Omit<Music, 'performers' | 'lyricists' | 'composers'> & {
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
  performers: Performer[];
  lyricists: Performer[];
  composers: Performer[];
};

const normalizePhotos = (photos: ArtistPhoto[] = []) =>
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
    performers: (music.performers ?? []).map((performer) => {
      const photos = normalizePhotos(performer.photos);
      return {
        ...performer,
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
    composers: (music.composers ?? []).map((artist) => {
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
      performers: (item.performers ?? []).map((performer) => ({
        ...performer,
        photos: normalizePhotos(performer.photos),
      })),
      lyricists: (item.lyricists ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
      composers: (item.composers ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
    })),
    forkFromList: music.forkFromList.map((item) => ({
      ...item,
      cover: prefixServerOrigin(item.cover),
      coverThumbnail: prefixServerOrigin(item.coverThumbnail ?? ''),
      performers: (item.performers ?? []).map((performer) => ({
        ...performer,
        photos: normalizePhotos(performer.photos),
      })),
      lyricists: (item.lyricists ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
      composers: (item.composers ?? []).map((artist) => ({
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
