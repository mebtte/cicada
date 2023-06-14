import XState from '@/utils/x_state';
import getMetadata from '@/server/base/get_metadata';
import logger from '@/utils/logger';
import setting from './setting';

const serverMetadata = new XState<{
  lastUpdateError: Error | null;

  version: string;
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
      logger.error(error, 'Fail to update server metadata');
      return serverMetadata.set((d) => ({
        ...d,
        lastUpdateError: error,
      }));
    });
}

updateMetadata();
window.setInterval(updateMetadata, 1000 * 15);
window.addEventListener('online', () =>
  window.setTimeout(updateMetadata, 1000),
);
setting.onChange(updateMetadata);

export default serverMetadata;
