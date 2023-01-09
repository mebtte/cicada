import XState from '@/utils/x_state';
import getMetadata from '@/server/get_metadata';
import logger from '#/utils/logger';

type Metadata = AsyncReturnType<typeof getMetadata>;

const serverMetadata = new XState<Metadata>({
  version: '',
});

function updateMetadata() {
  getMetadata()
    .then((data) => serverMetadata.set(data))
    .catch((error) => logger.error(error, '更新 metadata 失败'));
}
window.setInterval(updateMetadata, 1000 * 60 * 60);
updateMetadata();

export default serverMetadata;
