import logger from '#/utils/logger';
import XState from '#/utils/x_state';
import storage, { Key } from '@/storage';

const initialToken = await storage.getItem(Key.TOKEN);
const token = new XState(initialToken || '');

token.onChange((t) =>
  t
    ? storage
        .setItem(Key.TOKEN, t)
        .catch((error) => logger.error(error, '保存 token 失败'))
    : storage
        .removeItem(Key.TOKEN)
        .catch((error) => logger.error(error, '移除 token 失败')),
);

export default token;
