export const SEARCH_KEYWORD_MAX_LENGTH = 32;

export const ID_LENGTH = 8;

export enum MusicSearchType {
  COMPOSITE = 'composite',
  LYRIC = 'lyric',
}

export enum MusicType {
  SONG = 1, // 歌曲
  INSTRUMENTAL = 2, // 乐曲
}

export const MUSIC_TYPES = Object.values(MusicType).filter(
  (mt) => typeof mt === 'number',
) as MusicType[];

export const MUSIC_TYPE_MAP: Record<MusicType, { label: string }> = {
  [MusicType.SONG]: { label: '歌曲' },
  [MusicType.INSTRUMENTAL]: { label: '乐曲' },
};

export const NAME_MAX_LENGTH = 128;

export const MUSIC_MAX_ALIAS_COUNT = 5;
export const ALIAS_MAX_LENGTH = 64;

export enum AllowUpdateKey {
  COVER = 'cover',
  NAME = 'name',
  LYRIC = 'lyric',
  ALIASES = 'aliases',
  ASSET = 'asset',
  SINGER = 'singer',
  FORK_FROM = 'fork_from',
  YEAR = 'year',
}

export const MUSIC_MAX_LRYIC_AMOUNT = 5;

export const LYRIC_MAX_LENGTH = 16384;

export const YEAR_MIN = 0;
export const YEAR_MAX = 9999;
