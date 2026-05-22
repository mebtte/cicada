import { Music, SingerWithAliases } from '../constants';

export interface Lyric {
  id: number;
  lrc: string;
}

export interface CreateUser {
  id: string;
  nickname: string;
}

export interface SingerPhoto {
  id: string;
  asset: string;
  description: string;
}

export interface SingerDetail extends SingerWithAliases {
  avatar: string;
  photos: SingerPhoto[];
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
  singers: SingerDetail[];
  year: number | null;
  musicbillCount: number;
  assetSize: number;
  assetDurationMs: number;
  assetCodec: string;
  assetBitRate: number;
  relatedPublicMusicbillList: RelatedPublicMusicbill[];
}
