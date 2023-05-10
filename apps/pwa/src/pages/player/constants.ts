import { RequestStatus } from '@/constants';
import { MusicType } from '#/constants/music';
import { UtilZIndex } from '@/constants/style';

export const HEADER_HEIGHT = 55;

export interface Singer {
  id: string;
  name: string;
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

export interface MusicWithIndex extends Music {
  index: number;
}

export interface QueueMusic extends MusicWithIndex {
  pid: string;
  shuffle: boolean;
}

export interface Musicbill {
  id: string;
  name: string;
  cover: string;
  createTimestamp: number;
  public: boolean;

  musicList: MusicWithIndex[];

  status: RequestStatus;
  error: Error | null;
}

export const ZIndex = {
  CONTROLLER: 10,
  LYRIC_PANEL: 11,

  /**
   * 与下一级需要大数字间隔
   * 会随着时间的增加而增加
   * @author mebtte<hi@mebtte.com>
   */
  DYNAMIC_START: 12,

  DRAWER: UtilZIndex.PAGINATION - 1,
  POPUP: UtilZIndex.PAGINATION - 1,
  DIALOG: UtilZIndex.PAGINATION - 1,
};

export enum SearchTab {
  MUSIC = 'music',
  SINGER = 'singer',
  MUSICBILL = 'musicbill',
  LYRIC = 'lyric',
}
