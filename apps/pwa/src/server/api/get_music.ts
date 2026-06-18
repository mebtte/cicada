import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { upsertOfflineMusicMetadata } from '@/utils/offline_music';
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
  aliases?: string[];
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
  performers: (Performer & {
    aliases: string[];
  })[];
  lyricists: (Performer & {
    aliases: string[];
  })[];
  composers: (Performer & {
    aliases: string[];
  })[];
};

const normalizePhotos = (photos: ArtistPhoto[] = []) =>
  photos.map((p) => ({
    ...p,
    asset: prefixServerOrigin(p.asset),
    thumbnail: prefixServerOrigin(p.thumbnail ?? ''),
  }));

/**
 * 获取音乐详情
 * @author mebtte<i@mebtte.com>
 */
async function getMusic({
  id,
  requestMinimalDuration,
}: {
  id: string;
  requestMinimalDuration?: number;
}) {
  const music = await request<Response>({
    path: '/api/common/music',
    params: { id },
    withToken: true,
    requestMinimalDuration,
  });
  const prefixedCover = prefixServerOrigin(music.cover);
  const prefixedCoverThumbnail = prefixServerOrigin(music.coverThumbnail ?? '');
  const prefixedAsset = prefixServerOrigin(music.asset);
  upsertOfflineMusicMetadata({
    id: music.id,
    asset: prefixedAsset,
    type: music.type,
    name: music.name,
    aliases: music.aliases,
    cover: prefixedCover,
    coverThumbnail: prefixedCoverThumbnail,
    performers: (music.performers ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      aliases: s.aliases ?? [],
    })),
    lyricists: (music.lyricists ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      aliases: artist.aliases ?? [],
    })),
    composers: (music.composers ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      aliases: artist.aliases ?? [],
    })),
  });
  return {
    ...music,
    cover: prefixedCover,
    coverThumbnail: prefixedCoverThumbnail,
    asset: prefixedAsset,
    performers: (music.performers ?? []).map((s) => {
      const photos = normalizePhotos(s.photos);
      return {
        ...s,
        aliases: s.aliases ?? [],
        photos,
        avatar: photos[0]?.asset ?? '',
      };
    }),
    lyricists: (music.lyricists ?? []).map((artist) => {
      const photos = normalizePhotos(artist.photos);
      return {
        ...artist,
        aliases: artist.aliases ?? [],
        photos,
        avatar: photos[0]?.asset ?? '',
      };
    }),
    composers: (music.composers ?? []).map((artist) => {
      const photos = normalizePhotos(artist.photos);
      return {
        ...artist,
        aliases: artist.aliases ?? [],
        photos,
        avatar: photos[0]?.asset ?? '',
      };
    }),
    forkList: music.forkList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      coverThumbnail: prefixServerOrigin(m.coverThumbnail ?? ''),
      performers: (m.performers ?? []).map((s) => ({
        ...s,
        photos: normalizePhotos(s.photos),
      })),
      lyricists: (m.lyricists ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
      composers: (m.composers ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
    })),
    forkFromList: music.forkFromList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      coverThumbnail: prefixServerOrigin(m.coverThumbnail ?? ''),
      performers: (m.performers ?? []).map((s) => ({
        ...s,
        photos: normalizePhotos(s.photos),
      })),
      lyricists: (m.lyricists ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
      composers: (m.composers ?? []).map((artist) => ({
        ...artist,
        photos: normalizePhotos(artist.photos),
      })),
    })),
    relatedPublicMusicbillList: (
      music.relatedPublicMusicbillList ?? []
    ).map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
      user: {
        ...mb.user,
        avatar: prefixServerOrigin(mb.user.avatar),
      },
    })),
  };
}

export default getMusic;
