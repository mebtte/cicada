import { RequestStatus } from '@/constants';
import { MusicType } from '@/constants/music';
import { UtilZIndex } from '@/constants/style';
import { MusicExportQuality } from '@/utils/music_export_asset';

export const HEADER_HEIGHT = 72;

/**
 * 路由 state 字段: 标记本次跳转到发现页时需要自动聚焦搜索框.
 * 由 header 的搜索按钮设置, 发现页据此在挂载时聚焦搜索框.
 */
export const EXPLORATION_FOCUS_SEARCH_STATE = 'focusSearch';

export const CONTROLLER_BORDER_WIDTH = 2;
export const CONTROLLER_VERTICAL_PADDING = 4;
/* 封面相对于内容区四周再额外预留的留白 */
export const CONTROLLER_COVER_INSET = 2;
/* 水平 padding 在封面顶部视觉留白 (VERTICAL_PADDING + COVER_INSET) 基础上额外 +3px, 给操作区留出呼吸空间, 左右对称 */
export const CONTROLLER_HORIZONTAL_PADDING =
  CONTROLLER_VERTICAL_PADDING + CONTROLLER_COVER_INSET + 3;
export const CONTROLLER_PROGRESS_HEIGHT = 26;
export const CONTROLLER_BUTTON_ROW_HEIGHT = 34;

const CONTROLLER_PROGRESS_THUMB_SHADOW = 4;
export const CONTROLLER_COVER_SHADOW = 3;
const CONTROLLER_COVER_EXTRA_SIZE = 5;
const CONTROLLER_PROGRESS_BUTTON_VISIBLE_GAP = 2;

export const CONTROLLER_PROGRESS_BUTTON_GAP =
  CONTROLLER_PROGRESS_BUTTON_VISIBLE_GAP + CONTROLLER_PROGRESS_THUMB_SHADOW;

export const CONTROLLER_CONTENT_HEIGHT =
  CONTROLLER_PROGRESS_HEIGHT +
  CONTROLLER_PROGRESS_BUTTON_GAP +
  CONTROLLER_BUTTON_ROW_HEIGHT +
  CONTROLLER_COVER_EXTRA_SIZE;

/* 封面元素尺寸 = 内容区高度 - 两端额外留白; 阴影向下溢出元素本身, 视觉上抵消底部多余留白 */
export const CONTROLLER_COVER_HEIGHT =
  CONTROLLER_CONTENT_HEIGHT - CONTROLLER_COVER_INSET * 2;

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
  coverThumbnail?: string;
  name: string;
  type: MusicType;
  aliases: string[];
  singers: Singer[];
  lyricists: Singer[];
  composers: Singer[];
  asset: string;
}

export interface MusicWithSingerAliases
  extends Omit<Music, 'singers' | 'lyricists' | 'composers'> {
  singers: SingerWithAliases[];
  lyricists: SingerWithAliases[];
  composers: SingerWithAliases[];
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
  ARTIST = 'artist',
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
  /* 已下载字节数, EXPORTING 阶段由流式读取实时累加 */
  loaded?: number;
  /* 文件总字节数, 来自 Content-Length 响应头, 可能缺失 */
  total?: number;
}
