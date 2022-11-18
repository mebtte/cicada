import { MusicType } from '#/constants/music';
import { request } from '.';

function getUserDetail(id: string) {
  return request<{
    id: string;
    avatar: string;
    joinTimestamp: number;
    nickname: string;
    musicbillList: {
      id: string;
      cover: string;
      name: string;
      createTimestamp: number;
    }[];
    musicList: {
      id: string;
      type: MusicType;
      name: string;
      aliases: string[];
      cover: string;
      sq: string;
      hq: string;
      ac: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
    }[];
  }>({
    path: '/api/user_detail',
    params: { id },
    withToken: true,
  });
}

export default getUserDetail;
