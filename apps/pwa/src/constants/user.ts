export interface Profile {
  id: string;
  username: string;
  avatar: string;
  nickname: string;
  joinTimestamp: number;
  admin: boolean;
  musicbillOrders: string[];
  musicbillMaxAmount: number;
  createMusicMaxAmountPerDay: number;
  musicPlayRecordIndate: number;
}
