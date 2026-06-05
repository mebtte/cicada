import logger from '@/utils/logger';
import storage, { Key } from '@/storage';
import { type Server, type ServerState } from '@/constants/server';
import globalEventemitter, { EventType } from '@/platform/global_eventemitter';
import { create } from 'zustand';

export function getSelectedServer(ss: ServerState) {
  return ss.selectedServerOrigin
    ? ss.serverList.find((s) => s.origin === ss.selectedServerOrigin)
    : undefined;
}

export function getSelectedUser(server: Server | undefined) {
  return server?.selectedUserId
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

export const useServerMetadataStatus = create<{ error: Error | null }>(() => ({
  error: null,
}));

useServer.subscribe((server) =>
  storage
    .setItem(Key.SERVER, server)
    .catch((error) => logger.error(error, 'Failed to store server')),
);

function refreshSelectedServerMetadata() {
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
                  assetMaxSize: data.assetMaxSize,
                }
              : s,
          ),
        }));
        useServerMetadataStatus.setState({ error: null });
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
        useServerMetadataStatus.setState({ error });
        return globalEventemitter.emit(EventType.FETCH_SERVER_METADATA_FAILED, {
          error,
        });
      });
  }
}

refreshSelectedServerMetadata();
window.setInterval(refreshSelectedServerMetadata, 1000 * 15);

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
      let profile;
      try {
        profile = await getProfile(user.token);
      } catch (error) {
        /**
         * 离线/网络错误时保留 zustand 中既有用户态, 不清空登录
         * 401 的清空仍走 request 层处理
         */
        logger.error(error, 'reloadUser: failed to fetch profile');
        return;
      }
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
