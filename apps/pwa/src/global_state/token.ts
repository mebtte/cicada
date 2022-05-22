import XState from '@/utils/x_state';
import storage, { Key } from '@/platform/storage';

const initialToken = storage.getItem(Key.TOKEN) || '';
const token = new XState(initialToken);

token.onChange((t) => storage.setItem({ key: Key.TOKEN, value: t }));

export default token;
