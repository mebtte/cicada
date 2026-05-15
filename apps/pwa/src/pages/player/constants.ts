import { RequestStatus } from '@/constants';
import { MusicType } from '@/constants/music';
import { UtilZIndex } from '@/constants/style';
import { MusicExportQuality } from '@/utils/music_export_asset';

export const HEADER_HEIGHT = 72;

export const CONTROLLER_BORDER_WIDTH = 2;
export const CONTROLLER_VERTICAL_PADDING = 4;
export const CONTROLLER_PROGRESS_HEIGHT = 26;
export const CONTROLLER_BUTTON_ROW_HEIGHT = 34;

const CONTROLLER_PROGRESS_THUMB_SHADOW = 4;
const CONTROLLER_COVER_SHADOW = 3;
const CONTROLLER_COVER_EXTRA_SIZE = 5;
const CONTROLLER_PROGRESS_BUTTON_VISIBLE_GAP = 2;

export const CONTROLLER_PROGRESS_BUTTON_GAP =
  CONTROLLER_PROGRESS_BUTTON_VISIBLE_GAP + CONTROLLER_PROGRESS_THUMB_SHADOW;

export const CONTROLLER_CONTENT_HEIGHT =
  CONTROLLER_PROGRESS_HEIGHT +
  CONTROLLER_PROGRESS_BUTTON_GAP +
  CONTROLLER_BUTTON_ROW_HEIGHT +
  CONTROLLER_COVER_EXTRA_SIZE;

export const CONTROLLER_COVER_HEIGHT =
  CONTROLLER_CONTENT_HEIGHT - CONTROLLER_COVER_SHADOW;

export const CONTROLLER_HEIGHT =
  CONTROLLER_BORDER_WIDTH * 2 +
  CONTROLLER_VERTICAL_PADDING * 2 +
  CONTROLLER_CONTENT_HEIGHT;

export const CONTROLLER_FLOATING_GAP = 12;

export const CONTROLLER_FLOATING_BOTTOM = `calc(${CONTROLLER_FLOATING_GAP}px + env(safe-area-inset-bottom, 0))`;

export const CONTROLLER_FLOATING_RESERVED_HEIGHT = `calc(${CONTROLLER_HEIGHT}px + ${
  CONTROLLER_FLOATING_GAP * 2
}px + env(safe-area-inset-bottom, 0))`;

export const FLOATING_CONTROLLER_SCROLL_SPACE =
  CONTROLLER_FLOATING_RESERVED_HEIGHT;

export interface Singer {
  id: string;
  name: string;
}

export interface SingerWithAliases extends Singer {
  aliases: string[];
}

export interface Music {
  id: string;
  cover: string;
  name: string;
  type: MusicType;
  aliases: string[];
  singers: Singer[];
  asset: string;
}

export interface MusicWithSingerAliases extends Omit<Music, 'singers'> {
  singers: SingerWithAliases[];
}

export type PlaylistMusic = MusicWithSingerAliases & { index: number };

export interface QueueMusic extends MusicWithSingerAliases {
  index: number;
  pid: string;
  shuffle: boolean;
}

interface MusicbillUser {
  id: string;
  avatar: string;
  nickname: string;
}

export interface Musicbill {
  id: string;
  name: string;
  cover: string;
  createTimestamp: number;
  public: boolean;
  owner: MusicbillUser;
  sharedUserList: (MusicbillUser & {
    accepted: boolean;
  })[];
  musicList: (MusicWithSingerAliases & { index: number })[];

  status: RequestStatus;
  error: Error | null;
  lastUpdateTimestamp: number;
}

export const ZIndex = {
  CONTROLLER: 10,
  LYRIC_PANEL: 11,

  /**
   * 与下一级需要大数字间隔
   * 会随着时间的增加而增加
   * @author mebtte<i@mebtte.com>
   */
  DYNAMIC_START: 12,

  DRAWER: UtilZIndex.PAGINATION - 2,
  POPUP: UtilZIndex.PAGINATION - 2,
  DIALOG: UtilZIndex.PAGINATION - 2,

  FLOATING: UtilZIndex.PAGINATION - 1,
};

export enum SearchTab {
  MUSIC = 'music',
  SINGER = 'singer',
  PUBLIC_MUSICBILL = 'public_musicbill',
  LYRIC = 'lyric',
}

export enum ExportStatus {
  WAITING,
  EXPORTING,
  FAILED,
  SUCCESSFUL,
}

export interface ExportingMusic {
  id: string;
  music: Music;
  directoryHandle: FileSystemDirectoryHandle;
  asset: string;
  ext: string;
  quality: MusicExportQuality;
  status: ExportStatus;
}
