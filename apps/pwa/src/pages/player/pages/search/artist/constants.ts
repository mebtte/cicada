import { ArtistWithAliases } from '../../../constants';

export interface Artist extends ArtistWithAliases {
  avatar: string;
  avatarThumbnail?: string;
  musicCount: number;
}
