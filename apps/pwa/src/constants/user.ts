export const AVATAR_MAX_SIZE = 1000;

export const NICKNAME_MAX_LENGTH = 33;

export const REMARK_MAX_LENGTH = 255;

export interface Profile {
  id: string;
  email: string;
  avatar: string;
  nickname: string;
  joinTimestamp: number;
  admin: boolean;
}
