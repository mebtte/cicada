export type Response = {
  total: number;
  collectionList: {
    id: string;
    name: string;
    cover: string;
    user: { id: string; nickname: string };
  }[];
};
