import storage, { Key } from './platform/storage';
import env from './env';

function setServerAddress(sa: string) {
  storage.setItem({ key: Key.SERVER_ADDRESS, value: sa });
  window.setTimeout(() => window.location.reload(), 0);
}

export default new (class {
  private serverAddress: string;

  constructor() {
    this.serverAddress =
      storage.getItem(Key.SERVER_ADDRESS) || env.SERVER_ADDRESS;
  }

  getServerAddress() {
    return this.serverAddress;
  }

  setServerAddress = setServerAddress;
})();
