export interface Singer {
  id: string;
  name: string;
  aliases: string[];
  photos: {
    id: string;
    asset: string;
    description: string;
  }[];
  // 仅在歌手列表场景下由后端返回，编辑详情不包含
  musicCount?: number;
  createUser: {
    id: string;
    username: string;
    nickname: string;
  };
  createTimestamp: number;
}
