import { Language } from '@/constants/language';

export enum MusicPlaybackQuality {
  SMOOTH = 'smooth',
  SOURCE_BITRATE = 'source_bitrate',
}

export interface Setting {
  playerVolume: number;
  language: Language;
  musicPlaybackQuality: MusicPlaybackQuality;
}
