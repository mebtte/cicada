import { MusicbillSharedUserStatus } from '../../constants';

export type Response = {
  id: string;
  avatar: string;
  nickname: string;
  status: MusicbillSharedUserStatus;
}[];
