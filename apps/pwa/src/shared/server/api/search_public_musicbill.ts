export type Response = {
  total: number;
  musicbillList: {
    id: string;
    name: string;
    cover: string;
    musicCount: number;
    collectionCount: number;
    user: {
      id: string;
      nickname: string;
      avatar: string;
    };
  }[];
};
