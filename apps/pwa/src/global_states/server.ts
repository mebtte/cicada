import logger from '@/utils/logger';
import storage, { Key } from '@/storage';
import { type Server, type ServerState } from '@/constants/server';
import globalEventemitter, { EventType } from '@/platform/global_eventemitter';
import definition from '@/definition';
import { create } from 'zustand';

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
export const useServer = create(
  () =>
    initialServerList || {
      serverList: [],
    },
);

useServer.subscribe((server) => storage.setItem(Key.SERVER, server));

window.setInterval(() => {
  const selectedServer = getSelectedServer(useServer.getState());
  if (selectedServer) {
    import('@/server/base/get_metadata')
      .then(({ default: getMetadata }) => getMetadata(selectedServer.origin))
      .then((data) => {
        useServer.setState((server) => ({
          serverList: server.serverList.map((s) =>
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
}, 1000 * (definition.DEVELOPMENT ? 120 : 15));

export function prefixServerOrigin(path: string) {
  if (path) {
    return `${getSelectedServer(useServer.getState())?.origin}${path}`;
  }
  return path;
}

export function useSelectedServer() {
  const server = useServer();
  return getSelectedServer(server);
}

export function useUser() {
  const selectedServer = useSelectedServer();
  return selectedServer ? getSelectedUser(selectedServer) : undefined;
}

export async function reloadUser() {
  const selectedServer = getSelectedServer(useServer.getState());
  if (selectedServer) {
    const user = getSelectedUser(selectedServer);
    if (user) {
      const { default: getProfile } = await import('@/server/api/get_profile');
      const profile = await getProfile(user.token);
      useServer.setState((server) => ({
        serverList: server.serverList.map((s) =>
          s.origin === selectedServer.origin
            ? {
                ...s,
                users: s.users.map((u) =>
                  u.id === profile.id
                    ? {
                        ...u,

                        username: profile.username,
                        avatar: profile.avatar,
                        nickname: profile.nickname,
                        joinTimestamp: profile.joinTimestamp,
                        admin: !!profile.admin,
                        musicbillOrders: profile.musicbillOrdersJSON
                          ? JSON.parse(profile.musicbillOrdersJSON)
                          : [],
                        musicbillMaxAmount: profile.musicbillMaxAmount,
                        createMusicMaxAmountPerDay:
                          profile.createMusicMaxAmountPerDay,
                        musicPlayRecordIndate: profile.musicPlayRecordIndate,
                        twoFAEnabled: profile.twoFAEnabled,
                      }
                    : u,
                ),
              }
            : s,
        ),
      }));
    }
  }
}
