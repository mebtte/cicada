export interface Profile {
  id: string;
  email: string;
  avatar: string;
  nickname: string;
  joinTimestamp: number;
  admin: boolean;
  musicbillOrders: string[];
  musicbillMaxAmount: number;
  createMusicMaxAmountPerDay: number;
  musicPlayRecordIndate: number;
}
