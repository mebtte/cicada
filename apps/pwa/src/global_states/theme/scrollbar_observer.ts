import Eventin from 'eventin';

enum EventType {
  RESIZE = 'resize',
}
interface EventTypeMapData {
  [EventType.RESIZE]: null;
}

export default new (class {
  outer: HTMLDivElement;

  inner: HTMLDivElement;

  private readonly eventemitter: Eventin<EventType, EventTypeMapData>;

  constructor() {
    this.eventemitter = new Eventin<EventType, EventTypeMapData>();

    this.outer = document.createElement('div');
    this.outer.style.cssText = `
      visibility: hidden;
      overflow: scroll;
      width: 100px;
    `;

    this.inner = document.createElement('div');

    this.outer.appendChild(this.inner);
    document.body.appendChild(this.outer);

    const resizeObserver = new window.ResizeObserver(() =>
      this.eventemitter.emit(EventType.RESIZE, null),
    );
    resizeObserver.observe(this.inner);
  }

  getScrollbarWidth() {
    return this.outer.offsetWidth - this.inner.offsetWidth;
  }

  onChange(listener: () => void) {
    return this.eventemitter.listen(EventType.RESIZE, listener);
  }
})();
