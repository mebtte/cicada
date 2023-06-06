export type Response = {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  admin: 0 | 1;
  remark: string;
  joinTimestamp: number;
  lastActiveTimestamp: number;
  musicbillMaxAmount: number;
  createMusicMaxAmountPerDay: number;
  musicPlayRecordIndate: number;
}[];
