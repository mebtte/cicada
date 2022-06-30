export const SEARCH_KEYWORD_MAX_LENGTH = 12;

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

export const NAME_MAX_LENGTH = 32;
