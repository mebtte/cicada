export interface User {
  id: string;
  email: string;
  avatar: string;
  nickname: string;
  condition: string;
  cms: boolean;
  joinTime: Date;
  joinTimeString: string;
}

export const AVATAR_MAX_SIZE = 1000;

export const NICKNAME_MAX_LENGTH = 33;

export const CONDITION_MAX_LENGTH = 255;

export const REMARK_MAX_LENGTH = 255;
