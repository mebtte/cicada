import { request } from '.';

function getUserDetail(id: string) {
  return request<{
    id: string;
    avatar: string;
    email: string;
    joinTimestamp: number;
    nickname: string;
    musicbillList: {
      id: string;
      cover: string;
      name: string;
      createTimestamp: number;
    }[];
  }>({
    path: '/api/user_detail',
    params: { id },
    withToken: true,
  });
}

export default getUserDetail;
