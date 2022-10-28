import { RequestStatus } from '@/constants';
import { MusicType } from '#/constants/music';
import { Type as TagType } from '@/components/tag';
import { UtilZIndex } from '#/constants/style';

export const CONTROLLER_HEIGHT = 60;

export enum PlayMode {
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
}

export const PLAY_MODE_MAP: Record<
  PlayMode,
  {
    label: string;
    tagType: TagType;
  }
> = {
  [PlayMode.SQ]: {
    label: '标准音质',
    tagType: TagType.SQ,
  },
  [PlayMode.HQ]: {
    label: '无损音质',
    tagType: TagType.HQ,
  },
  [PlayMode.AC]: {
    label: '伴奏',
    tagType: TagType.AC,
  },
};

export const PLAY_MODES = Object.keys(PLAY_MODE_MAP) as PlayMode[];

export interface Singer {
  id: string;
  avatar: string;
  name: string;
  aliases: string[];
}

export interface Music {
  id: string;
  cover: string;
  name: string;
  type: MusicType;
  aliases: string[];
  ac: string;
  hq: string;
  sq: string;
  singers: Singer[];
}

export interface MusicWithIndex {
  index: number;
  music: Music;
}

export interface QueueMusic extends MusicWithIndex {
  pid: string;
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
  LYRIC_PANEL: 2,
  CONTROLLER: 3,

  /**
   * 与下一级需要大数字间隔
   * 会随着时间的增加而增加
   * @author mebtte<hi@mebtte.com>
   */
  DYNAMIC_START: 4,

  DRAWER: UtilZIndex.PAGINATION - 1,
  POPUP: UtilZIndex.PAGINATION - 1,
  DIALOG: UtilZIndex.PAGINATION - 1,
};
