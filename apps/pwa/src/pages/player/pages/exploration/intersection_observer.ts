type Callback = (entry: IntersectionObserverEntry) => void;
const targetMapCallbacks: Map<Element, Callback> = new Map();

const intersectionObserver = new IntersectionObserver((enties) => {
  for (const entry of enties) {
    const callback = targetMapCallbacks.get(entry.target);
    if (callback) {
      try {
        callback(entry);
      } catch (error) {
        console.error(error);
      }
    }
  }
});

export default {
  observe: (target: Element, callback: Callback) => {
    targetMapCallbacks.set(target, callback);
    return intersectionObserver.observe(target);
  },
  unobserve: (target: Element) => {
    targetMapCallbacks.delete(target);
    return intersectionObserver.unobserve(target);
  },
};
