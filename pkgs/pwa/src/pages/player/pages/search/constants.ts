import { Music, MusicWithIndex } from '../../constants';

export enum SearchType {
  COMPOSITE = 'composite',
  LYRIC = 'lyric',
}

export const SEARCH_TYPES = Object.values(SearchType) as SearchType[];

export enum Query {
  SEARCH_TYPE = 'search_type',
  SEARCH_VALUE = 'search_value',
  PAGE = 'page',
}

export interface MusicWithIndexAndLrc extends MusicWithIndex {
  music: Music & { lrc: string };
}

export const PAGE_SIZE = 30;
