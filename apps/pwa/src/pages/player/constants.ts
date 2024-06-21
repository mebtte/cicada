import { RequestStatus } from '@/constants';
import { MusicType } from '#/constants/music';
import { UtilZIndex } from '@/constants/style';

export const HEADER_HEIGHT = 55;

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

  STOP_TIMER: UtilZIndex.PAGINATION - 1,
};

export enum SearchTab {
  MUSIC = 'music',
  SINGER = 'singer',
  PUBLIC_MUSICBILL = 'public_musicbill',
  LYRIC = 'lyric',
}

export interface StopTimer {
  endTimestamp: number;
}

export interface StopTimerPosition {
  direction: 'left' | 'right';
  top: number;
}
