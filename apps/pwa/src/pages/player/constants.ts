import { RequestStatus } from '@/constants';
import { MusicType } from '#/constants/music';
import { UtilZIndex } from '@/constants/style';
import { MusicbillSharedStatus } from '#/constants';

export const HEADER_HEIGHT = 55;

export interface Index {
  index: number;
}

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

export interface QueueMusic extends MusicWithSingerAliases, Index {
  pid: string;
  shuffle: boolean;
}

export interface Musicbill {
  id: string;
  name: string;
  cover: string;
  createTimestamp: number;
  public: boolean;
  shareStatus: MusicbillSharedStatus;

  musicList: (MusicWithSingerAliases & Index)[];

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
  PUBLIC_MUSICBILL = 'public_musicbill',
  LYRIC = 'lyric',
}
