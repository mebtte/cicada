export type Response = {
  total: number;
  musicbillList: {
    id: string;
    name: string;
    cover: string;
    musicCount: number;
    user: { id: string; nickname: string; avatar: string };
    collectTimestamp: number;
  }[];
};
