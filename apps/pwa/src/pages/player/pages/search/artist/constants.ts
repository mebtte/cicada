import { SingerWithAliases } from '../../../constants';

export interface Artist extends SingerWithAliases {
  avatar: string;
  musicCount: number;
}
