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
  performers: ArtistInMusic[];
  lyricists: ArtistInMusic[];
  composers: ArtistInMusic[];
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
  performerMusicList: Music[];
  lyricistMusicList: Music[];
  composerMusicList: Music[];
}

type RawResponse = Omit<
  Response,
  'performerMusicList' | 'lyricistMusicList' | 'composerMusicList' | 'photos'
> & {
  performerMusicList?: Response['performerMusicList'];
  lyricistMusicList?: Response['lyricistMusicList'];
  composerMusicList?: Response['composerMusicList'];
  photos?: Response['photos'];
};

const normalizeMusic = (musicList: Music[] = []) =>
  musicList.map((music) => ({
    ...music,
    aliases: music.aliases ?? [],
    cover: prefixServerOrigin(music.cover),
    coverThumbnail: prefixServerOrigin(music.coverThumbnail ?? ''),
    asset: prefixServerOrigin(music.asset),
    performers: music.performers ?? [],
    lyricists: music.lyricists ?? [],
    composers: music.composers ?? [],
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
    performerMusicList: normalizeMusic(artist.performerMusicList),
    lyricistMusicList: normalizeMusic(artist.lyricistMusicList),
    composerMusicList: normalizeMusic(artist.composerMusicList),
  };
}

export default getArtist;
