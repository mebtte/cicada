export const SEARCH_KEYWORD_MAX_LENGTH = 32;

export enum MusicSearchType {
  COMPOSITE = 'composite',
  LYRIC = 'lyric',
}

export enum MusicDownloadType {
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
}

export enum MusicType {
  SONG = 1, // 歌曲
  INSTRUMENT = 2, // 乐曲
}

export const MUSIC_TYPES = Object.values(MusicType).filter(
  (mt) => typeof mt === 'number',
) as MusicType[];

export const MUSIC_TYPE_MAP: Record<MusicType, { label: string }> = {
  [MusicType.SONG]: { label: '歌曲' },
  [MusicType.INSTRUMENT]: { label: '乐曲' },
};

export const NAME_MAX_LENGTH = 32;

export const MUSIC_MAX_ALIAS_COUNT = 5;
export const ALIAS_MAX_LENGTH = 32;

export const MUSIC_SQ = {
  ACCEPT_MIMES: ['audio/mpeg', 'audio/x-m4a', 'video/mp4'],
  MAX_SIZE: 1024 * 1024 * 10,
};

export enum AllowUpdateKey {
  COVER = 'cover',
  NAME = 'name',
  LYRIC = 'lyric',
  ALIASES = 'aliases',
}

export const MUSIC_MAX_LRYIC_AMOUNT = 5;

export const LYRIC_MAX_LENGTH = 16384;
