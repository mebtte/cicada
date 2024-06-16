import XState from '@/utils/x_state';
import logger from '@/utils/logger';
import storage, { Key } from '@/storage';
import { type Server, type ServerState } from '@/constants/server';
import globalEventemitter, { EventType } from '@/platform/global_eventemitter';
import definition from '@/definition';
import { BETA_VERSION_START } from '#/constants';

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
    import('@/server/base/get_metadata')
      .then(({ default: getMetadata }) => getMetadata(selectedServer.origin))
      .then((data) => {
        if (
          !definition.DEVELOPMENT &&
          !data.version.startsWith(BETA_VERSION_START) &&
          !data.version.startsWith('2.')
        ) {
          /**
           * @todo 不兼容提示
           * @author mebtte<hi@mebtte.com>
           */
        }

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
}, 1000 * (definition.DEVELOPMENT ? 120 : 15));

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

export async function reloadUser() {
  const selectedServer = getSelectedServer(server.get());
  if (selectedServer) {
    const user = getSelectedUser(selectedServer);
    if (user) {
      const { default: getProfile } = await import('@/server/api/get_profile');
      const profile = await getProfile(user.token);
      server.set((ss) => ({
        ...ss,
        serverList: ss.serverList.map((s) =>
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

export default server;
