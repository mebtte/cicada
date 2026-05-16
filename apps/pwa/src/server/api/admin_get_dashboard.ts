import { request } from '..';

type Response = {
  generatedTimestamp: number;
  todayPlayCount: number;
  playCount7d: number;
  music: {
    total: number;
    totalAssetSize: number;
    totalDurationMs: number;
    created7d: number;
    withoutCoverCount: number;
  };
  singer: {
    total: number;
    created7d: number;
    photoCount: number;
    withoutPhotoCount: number;
  };
  user: {
    total: number;
    adminCount: number;
    activeUser7dCount: number;
  };
  musicbill: {
    total: number;
    public: number;
    shared: number;
  };
};

async function adminGetDashboard() {
  return request<Response>({
    path: '/api/admin/dashboard',
    withToken: true,
  });
}

export type AdminDashboard = Response;
export default adminGetDashboard;
