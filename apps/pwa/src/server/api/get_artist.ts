import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface ArtistInMusic {
  id: string;
  name: string;
  aliases: string[];
}

interface Music {
  id: string;
  type: MusicType;
  name: string;
  aliases: string[];
  cover: string;
  coverThumbnail?: string;
  asset: string;
  singers: ArtistInMusic[];
  lyricists: ArtistInMusic[];
}

interface Response {
  id: string;
  name: string;
  aliases: string[];
  photos: {
    id: string;
    asset: string;
    thumbnail?: string;
    description: string;
  }[];
  singerMusicList: Music[];
  lyricistMusicList: Music[];
}

type RawResponse = Omit<
  Response,
  'singerMusicList' | 'lyricistMusicList' | 'photos'
> & {
  singerMusicList?: Response['singerMusicList'];
  lyricistMusicList?: Response['lyricistMusicList'];
  photos?: Response['photos'];
};

const normalizeMusic = (musicList: Music[] = []) =>
  musicList.map((music) => ({
    ...music,
    aliases: music.aliases ?? [],
    cover: prefixServerOrigin(music.cover),
    coverThumbnail: prefixServerOrigin(music.coverThumbnail ?? ''),
    asset: prefixServerOrigin(music.asset),
    singers: music.singers ?? [],
    lyricists: music.lyricists ?? [],
  }));

async function getArtist(id: string): Promise<Response> {
  const artist = await request<RawResponse>({
    path: '/api/artist',
    params: { id },
    withToken: true,
  });
  const photos = artist.photos ?? [];
  return {
    id: artist.id,
    name: artist.name,
    aliases: artist.aliases ?? [],
    photos: photos.map((photo) => ({
      ...photo,
      asset: prefixServerOrigin(photo.asset),
      thumbnail: prefixServerOrigin(photo.thumbnail ?? ''),
    })),
    singerMusicList: normalizeMusic(artist.singerMusicList),
    lyricistMusicList: normalizeMusic(artist.lyricistMusicList),
  };
}

export default getArtist;
