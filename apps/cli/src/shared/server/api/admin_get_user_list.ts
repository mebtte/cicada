export type Response = {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  admin: 0 | 1;
  remark: string;
  joinTimestamp: number;
  lastActiveTimestamp: number;
  musicbillMaxAmount: number;
  createMusicMaxAmountPerDay: number;
  musicPlayRecordIndate: number;
  twoFAEnabled: boolean;
}[];
