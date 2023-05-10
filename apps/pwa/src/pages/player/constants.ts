import { RequestStatus, PlayMode } from '@/constants';
import { MusicType } from '#/constants/music';
import { Type as TagComponentType } from '@/components/tag';
import { UtilZIndex } from '@/constants/style';

export const HEADER_HEIGHT = 55;

export const PLAY_MODE_MAP: Record<
  PlayMode,
  {
    label: string;
    tagComponentType: TagComponentType;
  }
> = {
  [PlayMode.SQ]: {
    label: '标准音质',
    tagComponentType: TagComponentType.SQ,
  },
  [PlayMode.HQ]: {
    label: '无损音质',
    tagComponentType: TagComponentType.HQ,
  },
  [PlayMode.AC]: {
    label: '伴奏',
    tagComponentType: TagComponentType.AC,
  },
};

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
  sq: string;
  hq: string;
  ac: string;
  singers: Singer[];
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
