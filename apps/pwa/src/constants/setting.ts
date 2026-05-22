import { Language } from '@/constants/language';

export enum MusicPlaybackQuality {
  SMOOTH = 'smooth',
  SOURCE_BITRATE = 'source_bitrate',
}

export interface Setting {
  playerVolume: number;
  language: Language;
  musicPlaybackQuality: MusicPlaybackQuality;
  // 是否在播放器中展示「管理员快捷编辑」入口（singer/music drawer 编辑、歌词下载）, 仅管理员可切换
  adminQuickEdit: boolean;
}
