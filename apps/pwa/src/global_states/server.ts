import XState from '@/utils/x_state';
import logger from '@/utils/logger';
import storage, { Key } from '@/storage';
import { Server, ServerState } from '@/constants/server';
import globalEventemitter, { EventType } from '@/platform/global_eventemitter';
import getMetadata from '@/server/base/get_metadata';

export function getSelectedServer(ss: ServerState) {
  return ss.selectedServerOrigin
    ? ss.serverList.find((s) => s.origin === ss.selectedServerOrigin)
    : undefined;
}

export function getSelectedUser(server: Server) {
  return server.selectedUserId
    ? server.users.find((u) => u.id === server.selectedUserId)
    : undefined;
}

const initialServerList = await storage.getItem(Key.SERVER);
const server = new XState<ServerState>(
  initialServerList || {
    serverList: [],
  },
);

server.onChange((ss) => {
  storage.setItem(Key.SERVER, ss);
});

window.setInterval(() => {
  const selectedServer = getSelectedServer(server.get());
  if (selectedServer) {
    getMetadata(selectedServer.origin)
      .then((data) => {
        server.set((ss) => ({
          ...ss,
          serverList: ss.serverList.map((s) =>
            s.origin === selectedServer.origin
              ? {
                  ...s,
                  version: data.version,
                  hostname: data.hostname,
                }
              : s,
          ),
        }));
        return globalEventemitter.emit(
          EventType.FETCH_SERVER_METADATA_SUCCEEDED,
          null,
        );
      })
      .catch((error) => {
        logger.error(
          error,
          `Failed to fetch server "${selectedServer.origin}" metadata`,
        );
        return globalEventemitter.emit(EventType.FETCH_SERVER_METADATA_FAILED, {
          error,
        });
      });
  }
}, 1000 * 15);

export function prefixServerOrigin(path: string) {
  if (path) {
    return `${getSelectedServer(server.get())?.origin}${path}`;
  }
  return path;
}

export function useServer() {
  const serverState = server.useState();
  return getSelectedServer(serverState);
}

export function useUser() {
  const selectedServer = useServer();
  return selectedServer ? getSelectedUser(selectedServer) : undefined;
}

export default server;
