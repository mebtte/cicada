import { t } from '@/i18n';

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

export const NAME_MAX_LENGTH = 128;

export const MUSIC_MAX_ALIAS_COUNT = 5;
export const ALIAS_MAX_LENGTH = 64;
export const SEARCH_KEYWORDS_MAX_LENGTH = 4000;

export enum AllowUpdateKey {
  COVER = 'cover',
  NAME = 'name',
  LYRIC = 'lyric',
  ALIASES = 'aliases',
  SEARCH_KEYWORDS = 'searchKeywords',
  ASSET = 'asset',
  SINGER = 'singers',
  LYRICIST = 'lyricists',
  COMPOSER = 'composers',
  FORK_FROM = 'forkFrom',
  YEAR = 'year',
}

export const MUSIC_MAX_LRYIC_AMOUNT = 5;

export const LYRIC_MAX_LENGTH = 16384;

export const YEAR_MIN = 0;
export const YEAR_MAX = 9999;

/**
 * 有效播放百分比
 * @author mebtte<i@mebtte.com>
 */
export const EFFECTIVE_PLAY_PERCENT = 0.75;

export const MUSIC_TYPE_MAP: Record<MusicType, { label: string }> = {
  [MusicType.SONG]: { label: t('music_type_song') },
  [MusicType.INSTRUMENTAL]: { label: t('music_type_instrument') },
};
