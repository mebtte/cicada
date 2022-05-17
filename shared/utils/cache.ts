const { setInterval, clearInterval } = globalThis;

interface ValueWrapper {
  ttl: number;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

class Cache<
  Key extends string,
  Value extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key in Key]: any;
  },
> {
  private cache: Map<string, ValueWrapper> | null;

  private timer: ReturnType<typeof setInterval>;

  constructor({
    checkInterval = 1000 * 60 * 10,
  }: { checkInterval?: number } = {}) {
    this.cache = new Map<string, ValueWrapper>();

    this.timer = setInterval(() => {
      if (!this.cache) {
        return;
      }

      for (const key of this.cache.keys()) {
        const { ttl, timestamp } = this.cache.get(key)!;
        if (Date.now() - timestamp > ttl) {
          this.cache.delete(key);
        }
      }
    }, checkInterval);
  }

  set<K extends Key>({
    key,
    keyReplace,
    value,
    ttl = 1000 * 60,
  }: {
    key: K;
    keyReplace?: (k: string) => string;
    value: Value[K];
    ttl?: number;
  }): void {
    if (!this.cache) {
      return;
    }

    const newKey = keyReplace ? keyReplace(key) : key;
    this.cache.set(newKey, {
      ttl,
      timestamp: Date.now(),
      value,
    });
  }

  get<K extends Key>(
    key: K,
    keyReplace?: (k: string) => string,
  ): Value[K] | null {
    if (!this.cache) {
      return null;
    }

    const newKey = keyReplace ? keyReplace(key) : key;
    const cache = this.cache.get(newKey);

    if (!cache) {
      return null;
    }

    const { ttl, timestamp, value } = cache;

    if (Date.now() - timestamp > ttl) {
      this.cache.delete(newKey);
      return null;
    }

    return value;
  }

  destroy() {
    clearInterval(this.timer);
    this.cache = null;
  }
}

export default Cache;
