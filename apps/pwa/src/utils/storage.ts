import localforage from 'localforage';

class Storage<
  Key extends string,
  KeyMapData extends {
    [key in Key]: unknown;
  },
> {
  store: ReturnType<typeof localforage.createInstance>;

  constructor(name: string) {
    this.store = localforage.createInstance({
      driver: localforage.INDEXEDDB,
      name,
    });
  }

  getItem<K extends Key>(key: K) {
    return this.store.getItem<KeyMapData[K]>(key);
  }

  setItem<K extends Key>(key: K, value: KeyMapData[K]) {
    return this.store.setItem(key, value);
  }

  removeItem<K extends Key>(key: K) {
    return this.store.removeItem(key);
  }
}

export default Storage;
