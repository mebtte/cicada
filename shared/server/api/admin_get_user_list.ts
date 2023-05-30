type AdminGetUserList = {
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
  exportMusicbillMaxTimePerDay: number;
  musicPlayRecordIndate: number;
}[];

export default AdminGetUserList;
