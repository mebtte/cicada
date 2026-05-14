export interface Singer {
  id: string;
  name: string;
  aliases: string[];
  photos: {
    id: string;
    asset: string;
    description: string;
  }[];
  createUser: {
    id: string;
    username: string;
    nickname: string;
  };
  createTimestamp: number;
}
