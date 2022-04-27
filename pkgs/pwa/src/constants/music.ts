export const COVER_MAX_SIZE = 1000;
export const NAME_MAX_LENGTH = 255;
export const ALIAS_MAX_LENGTH = 255;
export const MV_LINK_MAX_LENGTH = 255;
export const MUSIC_SQ = {
  ACCEPT_MIMES: ['audio/mpeg', 'audio/x-m4a', 'video/mp4'],
  MAX_SIZE: 1024 * 1024 * 10,
};
export const MUSIC_HQ = {
  ACCEPT_MIMES: ['audio/flac'],
  MAX_SIZE: 1024 * 1024 * 50,
};
export const MUSIC_AC = {
  ACCEPT_MIMES: ['audio/mpeg', 'audio/x-m4a'],
  MAX_SIZE: 1024 * 1024 * 10,
};

export enum MusicType {
  NORMAL = 'normal',
  INSTRUMENT = 'instrument',
}
export const MUSIC_TYPE_MAP_LABEL: Record<MusicType, string> = {
  [MusicType.NORMAL]: '普通',
  [MusicType.INSTRUMENT]: '纯音乐',
};
export const MUSIC_TYPES = Object.keys(MUSIC_TYPE_MAP_LABEL) as MusicType[];
