import { Music, ArtistWithAliases } from '../constants';

export interface Lyric {
  id: number;
  lrc: string;
}

export interface CreateUser {
  id: string;
  nickname: string;
}

export interface ArtistPhoto {
  id: string;
  asset: string;
  thumbnail?: string;
  description: string;
}

export interface ArtistDetail extends ArtistWithAliases {
  avatar: string;
  photos: ArtistPhoto[];
}

export interface RelatedPublicMusicbill {
  id: string;
  name: string;
  cover: string;
  musicCount: number;
  user: CreateUser & {
    avatar: string;
  };
}

export interface MusicDetail extends Music {
  heat: number;
  lyrics: Lyric[];
  createTime: string;
  forkFromList: Omit<Music, 'asset' | 'type' | 'aliases'>[];
  forkList: Omit<Music, 'asset' | 'type' | 'aliases'>[];
  performers: ArtistDetail[];
  lyricists: ArtistDetail[];
  composers: ArtistDetail[];
  year: number | null;
  musicbillCount: number;
  assetSize: number;
  assetDurationMs: number;
  assetCodec: string;
  assetBitRate: number;
  relatedPublicMusicbillList: RelatedPublicMusicbill[];
}
