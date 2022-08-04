import localforage from 'localforage';

localforage.setDriver(localforage.INDEXEDDB);

class Storage<
  Key extends string,
  KeyMapData extends {
    [key in Key]: unknown;
  },
> {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  private getKey<K extends Key>(key: K) {
    return `${this.name}_${key}`;
  }

  getItem<K extends Key>(key: K) {
    return localforage.getItem<KeyMapData[K]>(this.getKey(key));
  }

  setItem<K extends Key>(key: K, value: KeyMapData[K]) {
    return localforage.setItem(this.getKey(key), value);
  }

  removeItem<K extends Key>(key: K) {
    return localforage.removeItem(this.getKey(key));
  }
}

export default Storage;
