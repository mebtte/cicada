export type Response = {
  musicList: {
    id: string;
    name: string;
    cover: string;
    singers: {
      id: string;
      name: string;
    }[];
  }[];
  singerList: {
    id: string;
    name: string;
    avatar: string;
  }[];
  publicMusicbillList: {
    id: string;
    name: string;
    cover: string;
    user: { id: string; nickname: string };
  }[];
};
