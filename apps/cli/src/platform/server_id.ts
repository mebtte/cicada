import { v4 as uuid } from 'uuid';
import fs from 'fs';
import { getServerIdPath } from '@/config';

let serverId: string | undefined;

export function getServerId() {
  if (!serverId) {
    serverId = uuid();
    fs.writeFileSync(getServerIdPath(), serverId);
  }

  return serverId;
}
