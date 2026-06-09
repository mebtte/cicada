import { request } from '..';

export interface AuthSession {
  id: string;
  deviceName: string;
  createTimestamp: number;
  lastSeenTimestamp: number;
  inactiveExpireTimestamp: number;
  current: boolean;
}

function getSessions() {
  return request<AuthSession[]>({
    path: '/api/sessions',
    withToken: true,
  });
}

export default getSessions;
