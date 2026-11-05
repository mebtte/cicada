import logger from '@/utils/logger';
import storage, { Key } from '@/storage';
import { type Server, type ServerState } from '@/constants/server';
import globalEventemitter, { EventType } from '@/platform/global_eventemitter';
import { create } from 'zustand';
import definition from '@/definition';
import { t } from '@/i18n';
import { isServerVersionSupported } from '@/utils/version';
import dialog from '@/utils/dialog';
import { ROOT_PATH } from '@/constants/route';
import { buildServerURL } from '@/utils/server_url';

export function getSelectedServer(ss: ServerState) {
  return ss.selectedServerBaseURL
    ? ss.serverList.find((s) => s.baseURL === ss.selectedServerBaseURL)
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

let unsupportedMetadataServerBaseURL: string | undefined;

function logoutFromUnsupportedServerVersion(
  selectedServer: Server,
  serverVersion: string,
) {
  const shouldAlert = unsupportedMetadataServerBaseURL !== selectedServer.baseURL;
  unsupportedMetadataServerBaseURL = selectedServer.baseURL;

  const error = new Error(
    t('server_version_unsupported', definition.VERSION, serverVersion),
  );
  useServer.setState((server) => ({
    selectedServerBaseURL: undefined,
    serverList: server.serverList.map((s) =>
      s.baseURL === selectedServer.baseURL
        ? {
            ...s,
            version: serverVersion,
            selectedUserId: undefined,
          }
        : s,
    ),
  }));
  useServerMetadataStatus.setState({ error });
  globalEventemitter.emit(EventType.FETCH_SERVER_METADATA_FAILED, { error });
  window.location.hash = ROOT_PATH.LOGIN;
  if (shouldAlert) {
    dialog.alert({ content: error.message });
  }
}

function refreshSelectedServerMetadata() {
  const selectedServer = getSelectedServer(useServer.getState());
  if (selectedServer) {
    import('@/server/base/get_metadata')
      .then(({ default: getMetadata }) => getMetadata(selectedServer.baseURL))
      .then((data) => {
        if (!isServerVersionSupported(definition.VERSION, data.version)) {
          logoutFromUnsupportedServerVersion(selectedServer, data.version);
          return;
        }
        unsupportedMetadataServerBaseURL = undefined;
        useServer.setState((server) => ({
          serverList: server.serverList.map((s) =>
            s.baseURL === selectedServer.baseURL
              ? {
                  ...s,
                  version: data.version,
                  hostname: data.hostname,
                  imageFileMaxSize: data.imageFileMaxSize,
                  audioFileMaxSize: data.audioFileMaxSize,
                  videoFileMaxSize: data.videoFileMaxSize,
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
          `Failed to fetch server "${selectedServer.baseURL}" metadata`,
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

export function resolveServerURL(path: string) {
  return buildServerURL(getSelectedServer(useServer.getState())?.baseURL, path);
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
          s.baseURL === selectedServer.baseURL
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
