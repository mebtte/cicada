import { MusicWithArtistAliases } from '../../../constants';

export interface MusicWithLyric extends MusicWithArtistAliases {
  lrc: string;
}

export const PAGE_SIZE = 20;
