import { SingerWithAliases } from '../../../constants';

export interface Singer extends SingerWithAliases {
  avatar: string;
  musicCount: number;
}
