import { SingerWithAliases } from '../../../constants';

export interface Artist extends SingerWithAliases {
  avatar: string;
  avatarThumbnail?: string;
  musicCount: number;
}
