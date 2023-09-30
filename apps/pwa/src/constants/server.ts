export interface User {
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
  twoFAEnabled: boolean;

  token: string;
}

export interface Server {
  version: string;
  hostname: string;

  origin: string;

  users: User[];
  selectedUserId?: string;
}

export interface ServerState {
  serverList: Server[];
  selectedServerOrigin?: string;
}
