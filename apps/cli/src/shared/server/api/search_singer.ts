export type Response = {
  total: number;
  singerList: {
    id: string;
    avatar: string;
    name: string;
    aliases: string[];
  }[];
};
