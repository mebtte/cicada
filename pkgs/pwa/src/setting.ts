import { SERVER_ADDRESS } from '@/constants/storage_key';

function setServerAddress(sa: string) {
  window.localStorage.setItem(SERVER_ADDRESS, sa);
  window.setTimeout(() => window.location.reload(), 0);
}

export default new (class {
  private serverAddress: string;

  constructor() {
    this.serverAddress = window.localStorage.getItem(SERVER_ADDRESS) || '';
  }

  getServerAddress() {
    return this.serverAddress;
  }

  setServerAddress = setServerAddress;
})();
