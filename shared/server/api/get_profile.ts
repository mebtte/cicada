export type Response = {
  id: string;
  email: string;
  avatar: string;
  nickname: string;
  joinTimestamp: number;
  admin: 0 | 1;
  musicbillOrdersJSON?: string | null;
  musicbillMaxAmount: number;
  createMusicMaxAmountPerDay: number;
  lastActiveTimestamp: number;
  musicPlayRecordIndate: number;
};
