type User = { id: string; nickname: string; avatar: string };

export type Response = {
  id: string;
  cover: string;
  name: string;
  public: boolean;
  createTimestamp: number;
  owner: User;
  sharedUserList: (User & {
    accepted: boolean;
  })[];
}[];
