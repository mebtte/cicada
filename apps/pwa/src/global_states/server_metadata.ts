import XState from '@/utils/x_state';
import getMetadata from '@/server/base/get_metadata';
import logger from '#/utils/logger';
import globalEventemitter, {
  EventType as GlobalEventType,
} from '@/platform/global_eventemitter';
import setting from './setting';

const serverMetadata = new XState<{
  version: string;
  lastUpdateError: Error | null;
}>({
  lastUpdateError: null,

  version: '',
});

function updateMetadata() {
  getMetadata()
    .then((data) =>
      serverMetadata.set({
        lastUpdateError: null,
        version: data.version,
      }),
    )
    .catch((error) => {
      logger.error(error, '更新 server metadata 失败');
      return serverMetadata.set((d) => ({
        ...d,
        lastUpdateError: error,
      }));
    });
}
updateMetadata();
window.setInterval(updateMetadata, 1000 * 15);
globalEventemitter.listen(
  GlobalEventType.RELOAD_SERVER_METADATA,
  updateMetadata,
);
window.addEventListener('online', () =>
  window.setTimeout(updateMetadata, 1000),
);
setting.onChange(updateMetadata);

export default serverMetadata;
