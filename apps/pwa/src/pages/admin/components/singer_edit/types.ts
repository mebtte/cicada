export interface Singer {
  id: string;
  name: string;
  aliases: string[];
  photos: {
    id: string;
    asset: string;
    description: string;
  }[];
  // 列表与编辑详情接口均会返回，用于判定能否删除歌手
  musicCount: number;
  createUser: {
    id: string;
    username: string;
    nickname: string;
  };
  createTimestamp: number;
}
