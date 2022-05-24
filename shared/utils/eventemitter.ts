interface Listener {
  once: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (data: any) => void;
}

class Eventemitter<
  EventType extends string,
  EventTypeMapData extends {
    [key in EventType]: unknown;
  },
> {
  private eventTypeMapListeners: Map<string, Listener[]>;

  constructor() {
    this.eventTypeMapListeners = new Map<string, Listener[]>();
  }

  emit<E extends EventType>(
    eventType: E,
    data: EventTypeMapData[E],
    {
      sync = false,
      eventTypeReplace,
    }: {
      sync?: boolean;
      eventTypeReplace?: (et: string) => string;
    } = {},
  ) {
    const execute = () => {
      const et = eventTypeReplace ? eventTypeReplace(eventType) : eventType;
      const listeners = this.eventTypeMapListeners.get(et) || [];
      listeners.forEach(({ once, listener }) => {
        listener(data);
        if (once) {
          this.off(eventType, listener, {
            once: true,
            eventTypeReplace,
          });
        }
      });
    };
    if (sync) {
      execute();
    } else {
      Promise.resolve().then(() => execute());
    }
  }

  on<E extends EventType>(
    eventType: E,
    listener: (data: EventTypeMapData[E]) => void,
    {
      once = false,
      eventTypeReplace,
    }: {
      eventTypeReplace?: (et: string) => string;
      once?: boolean;
    } = {},
  ) {
    const et = eventTypeReplace ? eventTypeReplace(eventType) : eventType;
    const listeners = [
      ...(this.eventTypeMapListeners.get(et) || []),
      {
        once,
        listener,
      },
    ];
    this.eventTypeMapListeners.set(et, listeners);
  }

  off<E extends EventType>(
    eventType: E,
    listener: (data: EventTypeMapData[E]) => void,
    {
      once = false,
      eventTypeReplace,
    }: {
      eventTypeReplace?: (et: string) => string;
      once?: boolean;
    } = {},
  ) {
    const et = eventTypeReplace ? eventTypeReplace(eventType) : eventType;
    const listeners = (this.eventTypeMapListeners.get(et) || []).filter(
      (item) => item.once !== once || item.listener !== listener,
    );
    this.eventTypeMapListeners.set(et, listeners);
  }
}

export default Eventemitter;
